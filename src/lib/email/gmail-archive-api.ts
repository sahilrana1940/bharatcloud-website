import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  GMAIL_ARCHIVE_BATCH_SIZE,
  GMAIL_ARCHIVE_ROUNDS_PER_REQUEST,
} from "@/lib/email/gmail-archive-constants";
import {
  countBackedUpEmails,
  getLastGmailPageToken,
  runE2eGmailBackup,
  EMAIL_BACKUP_S3_BUCKET,
} from "@/lib/email/e2e-gmail-backup";
import { isGmailReconnectError } from "@/lib/google/token-row";
import { getE2EBucket } from "@/lib/s3/config";

export { GMAIL_ARCHIVE_BATCH_SIZE, GMAIL_ARCHIVE_ROUNDS_PER_REQUEST };

export async function handleGmailArchivePost(
  req: Request,
  supabase: SupabaseClient,
  session: { companyId: string; email: string },
) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const limit = Math.min(
    GMAIL_ARCHIVE_BATCH_SIZE,
    readPositiveInt(url.searchParams.get("limit") ?? body.limit ?? body.maxMessages, GMAIL_ARCHIVE_BATCH_SIZE),
  );
  let offset = readPositiveInt(url.searchParams.get("offset") ?? body.offset, 0);
  let batch = readPositiveInt(
    url.searchParams.get("batch") ?? body.batch,
    Math.floor(offset / Math.max(limit, 1)) + 1,
  );
  let pageToken = String(url.searchParams.get("pageToken") || body.pageToken || body.nextPageToken || "").trim();
  if (!pageToken) {
    pageToken = (await getLastGmailPageToken(supabase, session.companyId, session.email)) || "";
  }
  const rounds = Math.min(
    GMAIL_ARCHIVE_ROUNDS_PER_REQUEST,
    readPositiveInt(body.rounds ?? url.searchParams.get("rounds"), GMAIL_ARCHIVE_ROUNDS_PER_REQUEST),
  );
  const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (requestedEmail && requestedEmail !== session.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Archive the signed-in mailbox only." },
      { status: 403 },
    );
  }

  let totalUploaded = 0;
  let totalProcessed = 0;
  let totalAlreadyArchived = 0;
  let totalSizeMb = 0;
  let lastOk: Extract<Awaited<ReturnType<typeof runE2eGmailBackup>>, { ok: true }> | null = null;

  for (let round = 0; round < rounds; round += 1) {
    let result: Awaited<ReturnType<typeof runE2eGmailBackup>>;
    try {
      result = await runE2eGmailBackup(supabase, {
        companyId: session.companyId,
        email: session.email,
        limit,
        offset: pageToken ? 0 : offset,
        batch: batch + round,
        pageToken: pageToken || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Archive failed";
      if (isGmailReconnectError(message)) return gmailReconnectResponse();
      const retryable = /socket hang up|socket disconnected|Client network socket|ECONNRESET|ETIMEDOUT|Timeout/i.test(
        message,
      );
      console.error(JSON.stringify({ route: "gmail-archive", message, retryable, round }));
      return NextResponse.json({ success: false, error: message, retryable }, { status: retryable ? 503 : 400 });
    }

    if (!result.ok) {
      if (result.needsReconnect || isGmailReconnectError(result.error || "")) {
        return gmailReconnectResponse();
      }
      if (lastOk && totalUploaded > 0) break;
      console.error(JSON.stringify({ route: "gmail-archive", error: result.error, runId: result.runId, round }));
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          runId: result.runId,
          retryable: result.retryable,
          tokenExpired: result.tokenExpired,
        },
        { status: result.retryable ? 503 : 400 },
      );
    }

    lastOk = result;
    totalUploaded += result.emailCount;
    totalProcessed += result.processed;
    totalAlreadyArchived += result.alreadyArchived;
    totalSizeMb += result.sizeMb;

    if (result.done || (!result.hasMore && !result.nextPageToken)) break;

    pageToken = result.nextPageToken?.trim() || "";
    offset = result.nextOffset;
    if (result.emailCount === 0 && result.hasMore && pageToken) continue;
    if (!result.hasMore) break;
  }

  if (!lastOk) {
    return NextResponse.json({ success: false, error: "Archive failed" }, { status: 500 });
  }

  const result = lastOk;
  const total = result.messagesTotal;
  const backedUpCount = await countBackedUpEmails(supabase, session.companyId, session.email);
  const hasMore = Boolean(result.hasMore && !result.done);
  const remaining = Math.max(0, total - backedUpCount);
  const pct = total > 0 ? Math.min(100, Math.round((backedUpCount / total) * 100)) : 100;
  const message =
    total === 0
      ? "Gmail mailbox has 0 messages."
      : `Archived ${totalUploaded}, Total ${backedUpCount.toLocaleString()} / ${total.toLocaleString()}`;

  return NextResponse.json({
    success: true,
    archived: totalUploaded,
    uploaded: totalUploaded,
    totalArchived: backedUpCount,
    nextOffset: result.nextOffset,
    hasMore,
    runId: result.runId,
    emailCount: totalUploaded,
    processed: totalProcessed,
    alreadyArchived: totalAlreadyArchived,
    sizeMb: totalSizeMb,
    bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
    s3Path: result.s3Path,
    nextPageToken: result.nextPageToken,
    done: result.done,
    resultSizeEstimate: total,
    messagesTotal: total,
    backedUpCount,
    remaining,
    batch: result.batch,
    offset: result.nextOffset,
    roundsCompleted: Math.min(rounds, totalProcessed > 0 ? rounds : 1),
    message,
    progress: total === 0 ? message : `Archived ${backedUpCount.toLocaleString()} of ${total.toLocaleString()} (${pct}%)`,
  });
}

function gmailReconnectResponse() {
  return NextResponse.json(
    { success: false, needsReconnect: true, message: "Gmail re-auth required" },
    { status: 401 },
  );
}

function readPositiveInt(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

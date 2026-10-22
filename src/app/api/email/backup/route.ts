import { NextResponse } from "next/server";

import {
  countBackedUpEmails,
  listEmailBackupRuns,
  listFileArchives,
  orgArchiveStorageTotals,
  orgEmailBackupTotals,
  runE2eGmailBackup,
  gmailMailboxCount,
  EMAIL_BACKUP_S3_BUCKET,
} from "@/lib/email/e2e-gmail-backup";
import { getE2EBucket } from "@/lib/s3/config";
import { archiveStorageClass } from "@/lib/storage/archiver-from-start";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export const runtime = "nodejs";
export const maxDuration = 300;

/** GET — backup runs, progress, org totals for admins. */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      demo: true,
      bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
      backedUpCount: 0,
      targetCount: 10000,
      runs: [],
    });
  }

  const url = new URL(req.url);
  const orgScope = url.searchParams.get("org") === "1";
  const owner = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  const { runs, tableMissing, supabaseError: runsError } = await listEmailBackupRuns(
    supabase,
    session.companyId,
    session.email,
  );

  const backedUpCount = await countBackedUpEmails(
    supabase,
    session.companyId,
    session.email,
  );

  let orgTotals = null;
  if (orgScope && owner) {
    orgTotals = await orgEmailBackupTotals(supabase, session.companyId);
  }

  const active = runs.find(
    (r) => (r as { status?: string }).status === "running",
  ) as { progress?: string; status?: string } | undefined;

  const { archives, tableMissing: archivesMissing, supabaseError: archivesError } = await listFileArchives(
    supabase,
    session.companyId,
    50,
    session.email,
  );
  const storageTotals = await orgArchiveStorageTotals(supabase, session.companyId, session.email);
  const mailbox = await gmailMailboxCount(supabase, session.companyId, session.email);
  const messagesTotal = "messagesTotal" in mailbox ? mailbox.messagesTotal : null;
  const gmailCountError = "error" in mailbox ? mailbox.error : null;
  const supabaseError = runsError || archivesError || null;
  const payload = {
    bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
    storageClass: archiveStorageClass(),
    backedUpCount,
    targetCount: 10000,
    runs,
    archives,
    archivesMissing,
    totalArchiveGb: storageTotals.totalMb / 1024,
    tableMissing,
    progress: active?.progress || "",
    status: active?.status || "idle",
    orgTotals,
    fromStart: true,
    retentionYears: 7,
    messagesTotal,
    gmailCountError,
    tokenExpired: "tokenExpired" in mailbox ? Boolean(mailbox.tokenExpired) : false,
    supabaseError,
    lastRun: runs[0] || null,
  };
  if (supabaseError) {
    return NextResponse.json(payload, { status: 503 });
  }
  return NextResponse.json(payload);
}

/** POST — start Gmail → E2E .eml backup. */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const limit = Math.min(3, readPositiveInt(url.searchParams.get("limit") ?? body.limit ?? body.maxMessages, 3));
  const offset = readPositiveInt(url.searchParams.get("offset") ?? body.offset, 0);
  const batch = readPositiveInt(url.searchParams.get("batch") ?? body.batch, Math.floor(offset / Math.max(limit, 1)) + 1);
  const pageToken = String(url.searchParams.get("pageToken") || body.pageToken || "").trim();
  const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (requestedEmail && requestedEmail !== session.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Archive the signed-in mailbox only." },
      { status: 403 },
    );
  }

  let result: Awaited<ReturnType<typeof runE2eGmailBackup>>;
  try {
    result = await runE2eGmailBackup(supabase, {
      companyId: session.companyId,
      email: session.email,
      limit,
      offset,
      batch,
      pageToken: pageToken || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    const retryable = /socket hang up|socket disconnected|Client network socket|ECONNRESET|ETIMEDOUT|Timeout/i.test(message);
    console.error(
      JSON.stringify({ route: "POST /api/email/backup", message, retryable }),
    );
    return NextResponse.json(
      { success: false, error: message, retryable },
      { status: retryable ? 503 : 400 },
    );
  }

  if (!result.ok) {
    console.error(
      JSON.stringify({ route: "POST /api/email/backup", error: result.error, runId: result.runId }),
    );
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

  const total = result.messagesTotal;
  return NextResponse.json({
    success: true,
    archived: result.processed,
    uploaded: result.emailCount,
    nextOffset: result.nextOffset,
    hasMore: result.hasMore,
    runId: result.runId,
    emailCount: result.emailCount,
    processed: result.processed,
    alreadyArchived: result.alreadyArchived,
    sizeMb: result.sizeMb,
    bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
    s3Path: result.s3Path,
    nextPageToken: result.nextPageToken,
    done: result.done,
    resultSizeEstimate: total,
    messagesTotal: total,
    batch: result.batch,
    offset: result.nextOffset,
    progress:
      total === 0
        ? "Gmail mailbox has 0 messages."
        : `Archiving ${result.nextOffset}/${total}...`,
  });
}

function readPositiveInt(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveMailboxScope } from "@/lib/archive/mailbox-scope";
import { upsertGmailFileArchiveRow } from "@/lib/archive/save-file-archive-row";
import {
  countBackedUpEmails,
  fetchRawMessage,
  gmailMailboxCount,
  loadAllArchivedGmailIds,
} from "@/lib/email/e2e-gmail-backup";
import { GMAIL_API_TIMEOUT_MS, GMAIL_ARCHIVE_BATCH_SIZE } from "@/lib/email/gmail-archive-constants";
import { gmailClient } from "@/lib/google/client";
import { putArchiverObject } from "@/lib/storage/archiver-from-start";
import { getE2EBucket } from "@/lib/s3/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type E2eGmailBackupResponse = {
  archived: number;
  total: number;
  continue: boolean;
  nextPageToken?: string | null;
  batchUploaded?: number;
  error?: string | null;
};

async function gmailInAnywhereTotal(gmail: NonNullable<ReturnType<typeof gmailClient>>) {
  const list = await gmail.users.messages.list(
    { userId: "me", q: "in:anywhere", maxResults: 1 },
    { timeout: GMAIL_API_TIMEOUT_MS },
  );
  const estimate = Number(list.data.resultSizeEstimate);
  if (Number.isFinite(estimate) && estimate >= 0) return estimate;
  const profile = await gmail.users.getProfile({ userId: "me" });
  const profileTotal = Number(profile.data.messagesTotal);
  return Number.isFinite(profileTotal) ? profileTotal : 0;
}

/** Existing archive keys for this company (file_name + parsed Gmail ids). */
async function loadCompanyArchiveSkipSet(companyId: string) {
  const db = getSupabaseAdmin();
  const skipIds = new Set<string>();
  if (!db) return skipIds;

  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("file_archives")
      .select("file_name, gmail_message_id, s3_path")
      .eq("company_id", companyId)
      .range(from, from + pageSize - 1);
    if (error) {
      console.error(error.message);
      break;
    }
    const rows = data || [];
    if (!rows.length) break;
    for (const row of rows) {
      const gid = typeof row.gmail_message_id === "string" ? row.gmail_message_id.trim() : "";
      if (gid) skipIds.add(gid);
      const fileName = String(row.file_name || "");
      const fromFile = fileName.match(/^([a-z0-9]+)\.eml$/i)?.[1];
      if (fromFile) skipIds.add(fromFile);
      const fromPath = String(row.s3_path || "").match(/\/emails\/([a-z0-9]+)\.eml$/i)?.[1];
      if (fromPath) skipIds.add(fromPath);
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return skipIds;
}

export async function runE2eGmailBackupBatch(
  supabase: SupabaseClient,
  session: { companyId: string; email: string },
  body: Record<string, unknown>,
): Promise<E2eGmailBackupResponse> {
  const scope = await resolveMailboxScope(supabase, session.companyId, session.email);
  const companyId = scope.companyId;
  const email = scope.email;
  const userId = scope.userId;

  let archived = await countBackedUpEmails(supabase, companyId, email, userId);
  let total = 0;
  let nextPageToken: string | null =
    typeof body.pageToken === "string" ? body.pageToken.trim() || null : null;
  let batchUploaded = 0;
  let lastError: string | null = null;

  try {
    const counted = await gmailMailboxCount(supabase, companyId, email);
    if ("error" in counted) {
      return {
        archived,
        total: archived,
        continue: false,
        nextPageToken,
        batchUploaded: 0,
        error: counted.error,
      };
    }

    const gmail = counted.gmail;
    total = await gmailInAnywhereTotal(gmail);
    if (total <= 0 && counted.messagesTotal > 0) total = counted.messagesTotal;

    const companySkip = await loadCompanyArchiveSkipSet(companyId);
    const mailboxSkip = await loadAllArchivedGmailIds(supabase, companyId, email, userId);
    const skipIds = new Set([...companySkip, ...mailboxSkip]);

    const bucket = (getE2EBucket() || process.env.ARCHIVE_E2E_BUCKET || "").replace(/\s+/g, "");
    if (!bucket) {
      return {
        archived,
        total,
        continue: archived < total,
        nextPageToken,
        batchUploaded: 0,
        error: "ARCHIVE_E2E_BUCKET is not set",
      };
    }

    if (!userId) {
      return {
        archived,
        total,
        continue: false,
        nextPageToken,
        batchUploaded: 0,
        error: "Could not resolve user_id for this mailbox.",
      };
    }

    let listToken: string | undefined = nextPageToken || undefined;
    const maxUploads = GMAIL_ARCHIVE_BATCH_SIZE;

    while (batchUploaded < maxUploads) {
      const list = await gmail.users.messages.list(
        {
          userId: "me",
          q: "in:anywhere",
          maxResults: 100,
          ...(listToken ? { pageToken: listToken } : {}),
        },
        { timeout: GMAIL_API_TIMEOUT_MS },
      );

      const messages = list.data.messages || [];
      const listNext = list.data.nextPageToken || null;
      if (!messages.length) {
        nextPageToken = null;
        break;
      }

      let resumeToken: string | null = listToken || null;

      for (const message of messages) {
        const id = message.id;
        if (!id) continue;
        resumeToken = listToken || resumeToken;

        if (skipIds.has(id)) {
          continue;
        }

        try {
          const rawEmail = await fetchRawMessage(gmail, id);
          const key = `${companyId}/emails/${id}.eml`;
          const up = await putArchiverObject({
            key,
            body: rawEmail,
            contentType: "message/rfc822",
            bucket,
            storageClass: "GLACIER",
          });
          if (!up.ok) throw new Error(up.error);

          const indexed = await upsertGmailFileArchiveRow({
            org_id: companyId,
            user_id: userId,
            user_email: email,
            gmail_message_id: id,
            file_name: `${id}.eml`,
            s3_key: key,
            size_bytes: rawEmail.length,
          });
          if (!indexed.ok) throw new Error(indexed.error);

          skipIds.add(id);
          batchUploaded += 1;
          archived += 1;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("skip", id, msg);
          lastError = msg;
          continue;
        }

        if (batchUploaded >= maxUploads) {
          nextPageToken = listToken || resumeToken;
          break;
        }
      }

      if (batchUploaded >= maxUploads) break;

      listToken = listNext || undefined;
      nextPageToken = listNext;
      if (!listToken) break;
    }

    archived = await countBackedUpEmails(supabase, companyId, email, userId);

    return {
      archived,
      total,
      continue: archived < total && Boolean(nextPageToken || batchUploaded > 0),
      nextPageToken,
      batchUploaded,
      error: lastError,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Archive batch failed";
    console.error(msg);
    archived = await countBackedUpEmails(supabase, companyId, email, userId).catch(() => archived);
    return {
      archived,
      total: total || archived,
      continue: archived < total && Boolean(nextPageToken),
      nextPageToken,
      batchUploaded,
      error: msg,
    };
  }
}

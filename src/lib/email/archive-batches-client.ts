import {
  GMAIL_ARCHIVE_BATCH_SIZE,
  GMAIL_ARCHIVE_ROUNDS_PER_REQUEST,
} from "@/lib/email/gmail-archive-constants";

export type ArchiveBatchProgress = {
  archived: number;
  total: number;
  batch: number;
  label: string;
  offset: number;
  remaining: number;
  percent: number;
};

type BatchResponse = {
  error?: string;
  archived?: number;
  uploaded?: number;
  processed?: number;
  emailCount?: number;
  nextOffset?: number;
  hasMore?: boolean;
  done?: boolean;
  resultSizeEstimate?: number;
  messagesTotal?: number | null;
  backedUpCount?: number;
  remaining?: number;
  gmailCountError?: string;
  tokenExpired?: boolean;
  needsReconnect?: boolean;
  message?: string;
  progress?: string;
  nextPageToken?: string | null;
  totalArchived?: number;
};

const AUTO_CONTINUE_DELAY_MS = 2000;

/** One POST archives up to BATCH_SIZE × ROUNDS (250) messages. */
export async function archiveMailboxInBatches(
  onProgress: (progress: ArchiveBatchProgress) => void,
  start: { offset: number; pageToken: string },
  opts?: { autoContinue?: boolean; onAutoDelay?: () => void; shouldStop?: () => boolean },
): Promise<
  | {
      ok: true;
      archived: number;
      total: number;
      offset: number;
      hasMore: boolean;
      pageToken: string;
      message: string;
      remaining: number;
      backedUpCount: number;
      percent: number;
    }
  | { ok: false; error: string; archived: number; offset: number; tokenExpired?: boolean; needsReconnect?: boolean }
> {
  let cursor = { ...start };
  let lastUploaded = 0;
  let mailboxTotal = 0;
  let backedUpCount = 0;
  let remaining = 0;
  let message = "";
  let hasMore = true;

  while (true) {
    if (opts?.shouldStop?.()) {
      return {
        ok: true,
        archived: lastUploaded,
        total: mailboxTotal,
        offset: cursor.offset,
        hasMore,
        pageToken: cursor.pageToken,
        message: message || "Auto-archive stopped.",
        remaining,
        backedUpCount,
        percent: mailboxTotal > 0 ? Math.min(100, Math.round((backedUpCount / mailboxTotal) * 100)) : 100,
      };
    }

    const sent = await postBatch(cursor);
    if (!sent.ok) {
      return {
        ok: false,
        error: sent.error,
        archived: cursor.offset,
        offset: cursor.offset,
        tokenExpired: sent.tokenExpired,
        needsReconnect: sent.needsReconnect,
      };
    }
    if (sent.body.gmailCountError || sent.body.tokenExpired) {
      return {
        ok: false,
        error: sent.body.gmailCountError || sent.body.error || "Gmail mailbox count failed",
        archived: cursor.offset,
        offset: cursor.offset,
        tokenExpired: sent.body.tokenExpired,
      };
    }
    if (sent.body.error) {
      return { ok: false, error: sent.body.error, archived: cursor.offset, offset: cursor.offset };
    }

    mailboxTotal = Number(sent.body.messagesTotal ?? sent.body.resultSizeEstimate);
    if (!Number.isFinite(mailboxTotal)) {
      return { ok: false, error: "Gmail mailbox count failed", archived: cursor.offset, offset: cursor.offset };
    }

    lastUploaded = Number(sent.body.uploaded ?? sent.body.archived ?? sent.body.emailCount) || 0;
    backedUpCount = Number(sent.body.totalArchived ?? sent.body.backedUpCount);
    if (!Number.isFinite(backedUpCount)) {
      backedUpCount = cursor.offset + lastUploaded;
    }
    remaining =
      Number.isFinite(Number(sent.body.remaining)) && sent.body.remaining != null
        ? Number(sent.body.remaining)
        : Math.max(0, mailboxTotal - backedUpCount);
    const offset = Number(sent.body.nextOffset ?? cursor.offset + (sent.body.processed ?? lastUploaded));
    const pageToken = String(sent.body.nextPageToken || "").trim();
    hasMore = Boolean(sent.body.hasMore) && sent.body.done !== true;
    const percent = mailboxTotal > 0 ? Math.min(100, Math.round((backedUpCount / mailboxTotal) * 100)) : 100;
    message =
      sent.body.progress ||
      sent.body.message ||
      `Archived ${backedUpCount.toLocaleString()} of ${mailboxTotal.toLocaleString()} (${percent}%)`;

    cursor = { offset, pageToken };
    onProgress({
      archived: backedUpCount,
      total: mailboxTotal,
      batch: 1,
      label: message,
      offset,
      remaining,
      percent,
    });

    if (lastUploaded === 0 && mailboxTotal > 0 && !hasMore && !pageToken) {
      return {
        ok: false,
        error: sent.body.error || "E2E upload saved 0 emails — check Gmail token and E2E config",
        archived: cursor.offset,
        offset: cursor.offset,
      };
    }

    if (!hasMore) {
      return {
        ok: true,
        archived: lastUploaded,
        total: mailboxTotal,
        offset,
        hasMore: false,
        pageToken,
        message,
        remaining,
        backedUpCount,
        percent,
      };
    }

    if (!opts?.autoContinue) {
      return {
        ok: true,
        archived: lastUploaded,
        total: mailboxTotal,
        offset,
        hasMore: true,
        pageToken,
        message,
        remaining,
        backedUpCount,
        percent,
      };
    }

    opts.onAutoDelay?.();
    await new Promise((resolve) => setTimeout(resolve, AUTO_CONTINUE_DELAY_MS));
  }
}

async function postBatch(start: {
  offset: number;
  pageToken: string;
}): Promise<{ ok: true; body: BatchResponse } | { ok: false; error: string; tokenExpired?: boolean; needsReconnect?: boolean }> {
  let lastError = "Connection closed";
  const batch = Math.floor(start.offset / GMAIL_ARCHIVE_BATCH_SIZE) + (start.pageToken ? 2 : 1);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch("/api/gmail/archive", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: GMAIL_ARCHIVE_BATCH_SIZE,
          rounds: GMAIL_ARCHIVE_ROUNDS_PER_REQUEST,
          offset: 0,
          pageToken: start.pageToken || undefined,
          batch,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as BatchResponse;
      if (res.ok) return { ok: true, body };
      lastError = body.message || body.gmailCountError || body.error || `Archive failed (${res.status})`;
      if (body.needsReconnect || res.status === 401) {
        return { ok: false, error: lastError, tokenExpired: true, needsReconnect: true };
      }
      if (res.status < 500 || body.tokenExpired) {
        return { ok: false, error: lastError, tokenExpired: body.tokenExpired };
      }
    } catch {
      lastError = "Connection closed. The last batch can be retried.";
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  return { ok: false, error: lastError };
}

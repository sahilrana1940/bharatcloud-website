export type ArchiveBatchProgress = {
  archived: number;
  total: number;
  batch: number;
  label: string;
  offset: number;
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
  gmailCountError?: string;
  tokenExpired?: boolean;
};

/** One click archives one page of 25 messages. The next click continues from offset. */
export async function archiveMailboxInBatches(
  onProgress: (progress: ArchiveBatchProgress) => void,
  startOffset = 0,
): Promise<
  | { ok: true; archived: number; total: number; offset: number; hasMore: boolean }
  | { ok: false; error: string; archived: number; offset: number; tokenExpired?: boolean }
> {
  const sent = await postBatch(startOffset, Math.floor(startOffset / 25) + 1);
  if (!sent.ok) {
    return { ok: false, error: sent.error, archived: startOffset, offset: startOffset, tokenExpired: sent.tokenExpired };
  }
  if (sent.body.gmailCountError || sent.body.tokenExpired) {
    return {
      ok: false,
      error: sent.body.gmailCountError || sent.body.error || "Gmail mailbox count failed",
      archived: startOffset,
      offset: startOffset,
      tokenExpired: sent.body.tokenExpired,
    };
  }
  if (sent.body.error) {
    return { ok: false, error: sent.body.error, archived: startOffset, offset: startOffset };
  }

  const mailboxTotal = Number(sent.body.messagesTotal ?? sent.body.resultSizeEstimate);
  if (!Number.isFinite(mailboxTotal)) {
    return { ok: false, error: "Gmail mailbox count failed", archived: startOffset, offset: startOffset };
  }

  const uploaded = Number(sent.body.uploaded ?? sent.body.emailCount) || 0;
  const step = Number(sent.body.archived ?? sent.body.processed ?? sent.body.emailCount) || 0;
  const offset = Number(sent.body.nextOffset ?? startOffset + step);
  const hasMore = Boolean(sent.body.hasMore) && sent.body.done !== true;
  const label =
    mailboxTotal === 0
      ? "Gmail mailbox has 0 messages."
      : hasMore
        ? `Archived ${offset}/${mailboxTotal}. Click Archive Now for the next 25.`
        : `Archived ${offset}/${mailboxTotal}`;
  onProgress({ archived: offset, total: mailboxTotal, batch: 1, label, offset });
  if (uploaded === 0 && step === 0 && mailboxTotal > 0) {
    return { ok: false, error: sent.body.error || "E2E upload saved 0 emails", archived: startOffset, offset: startOffset };
  }
  return { ok: true, archived: offset, total: mailboxTotal, offset, hasMore };
}

async function postBatch(
  offset: number,
  batch: number,
): Promise<{ ok: true; body: BatchResponse } | { ok: false; error: string; tokenExpired?: boolean }> {
  let lastError = "Connection closed";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch("/api/email/backup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 25, offset, batch }),
      });
      const body = (await res.json().catch(() => ({}))) as BatchResponse;
      if (res.ok) return { ok: true, body };
      lastError = body.gmailCountError || body.error || `Archive failed (${res.status})`;
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

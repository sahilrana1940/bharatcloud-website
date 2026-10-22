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

/** One request archives at most 25 messages. The caller walks offset until hasMore is false. */
export async function archiveMailboxInBatches(
  onProgress: (progress: ArchiveBatchProgress) => void,
  startOffset = 0,
): Promise<
  | { ok: true; archived: number; total: number; offset: number }
  | { ok: false; error: string; archived: number; offset: number; tokenExpired?: boolean }
> {
  let offset = startOffset;
  let total = 0;
  let batch = 0;

  for (let page = 0; page < 400; page += 1) {
    batch += 1;
    const sent = await postBatch(offset, batch);
    if (!sent.ok) {
      return { ok: false, error: sent.error, archived: offset, offset, tokenExpired: sent.tokenExpired };
    }
    if (sent.body.gmailCountError || sent.body.tokenExpired) {
      return {
        ok: false,
        error: sent.body.gmailCountError || "Gmail mailbox count failed",
        archived: offset,
        offset,
        tokenExpired: sent.body.tokenExpired,
      };
    }
    const mailboxTotal = Number(sent.body.messagesTotal ?? sent.body.resultSizeEstimate);
    if (!Number.isFinite(mailboxTotal)) {
      return { ok: false, error: "Gmail mailbox count failed", archived: offset, offset };
    }

    const step = Number(sent.body.archived ?? sent.body.processed ?? sent.body.emailCount) || 0;
    offset = Number(sent.body.nextOffset ?? offset + step);
    total = mailboxTotal;
    const label = mailboxTotal === 0 ? "Gmail mailbox has 0 messages." : `Archiving ${offset}/${mailboxTotal}...`;
    onProgress({ archived: offset, total, batch, label, offset });

    if (sent.body.hasMore === false || sent.body.done || step === 0) {
      return { ok: true, archived: offset, total, offset };
    }
  }

  return { ok: true, archived: offset, total, offset };
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

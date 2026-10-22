/** Messages uploaded per archive batch (one Vercel POST). */
export const GMAIL_ARCHIVE_BATCH_SIZE = 10;

/** Batch size for POST /api/email/backup (smaller for Vercel timeouts). */
export const EMAIL_BACKUP_BATCH_SIZE = 3;

/** Wait before retrying archive POST after HTTP 503. */
export const GMAIL_ARCHIVE_503_RETRY_MS = 5000;

/** One round per POST — client polls and kicks next batch. */
export const GMAIL_ARCHIVE_ROUNDS_PER_REQUEST = 1;

/** Gmail list pages to scan per round when skipping already-archived IDs. */
export const GMAIL_LIST_MAX_PAGES = 3;

export const GMAIL_AUTO_BATCH_DELAY_MS = 2000;

/** Gmail API HTTP timeout (ms). */
export const GMAIL_API_TIMEOUT_MS = 30_000;

/** Retries after TLS / aborted network errors (ms between attempts). */
export const GMAIL_TLS_RETRY_DELAYS_MS = [5000, 10_000, 15_000] as const;

export const GMAIL_ARCHIVE_STATUS_POLL_MS = 10_000;

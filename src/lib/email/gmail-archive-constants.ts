/** Messages uploaded per archive batch (one Vercel POST). */
export const GMAIL_ARCHIVE_BATCH_SIZE = 25;

/** One round per POST — auto-loop in the client chains batches every 2s. */
export const GMAIL_ARCHIVE_ROUNDS_PER_REQUEST = 1;

/** Gmail list pages to scan per round when skipping already-archived IDs. */
export const GMAIL_LIST_MAX_PAGES = 3;

export const GMAIL_AUTO_BATCH_DELAY_MS = 2000;

/** Messages per inner archive round (server). */
export const GMAIL_ARCHIVE_BATCH_SIZE = 50;

/** Inner rounds per POST — 50 × 5 = 250 per click. */
export const GMAIL_ARCHIVE_ROUNDS_PER_REQUEST = 5;

/** Gmail list pages to scan per round when skipping already-archived IDs. */
export const GMAIL_LIST_MAX_PAGES = 3;

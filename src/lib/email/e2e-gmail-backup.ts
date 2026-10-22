import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveMailboxScope, type MailboxScope } from "@/lib/archive/mailbox-scope";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { isGmailReconnectError } from "@/lib/google/token-row";
import { gmailClient } from "@/lib/google/client";
import { ARCHIVER_BUCKET, archiveGmailEml } from "@/lib/storage/archiver-from-start";
import { getE2EBucket, isS3Configured, resolveE2EEndpoint } from "@/lib/s3/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const EMAIL_BACKUP_S3_BUCKET = ARCHIVER_BUCKET;

import {
  GMAIL_API_TIMEOUT_MS,
  GMAIL_ARCHIVE_BATCH_SIZE,
  GMAIL_ARCHIVE_ROUNDS_PER_REQUEST,
  GMAIL_LIST_MAX_PAGES,
  GMAIL_TLS_RETRY_DELAYS_MS,
} from "@/lib/email/gmail-archive-constants";

export { GMAIL_ARCHIVE_BATCH_SIZE, GMAIL_ARCHIVE_ROUNDS_PER_REQUEST, GMAIL_LIST_MAX_PAGES };

const DEFAULT_MAX = GMAIL_ARCHIVE_BATCH_SIZE;
const MAX_CAP = GMAIL_ARCHIVE_BATCH_SIZE;

function isTlsOrAbortedError(message: string) {
  return /aborted|TLS|socket|ECONNRESET|ETIMEDOUT|Timeout|disconnect|hang up/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTlsRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError = `${label} failed`;
  for (let attempt = 0; attempt <= GMAIL_TLS_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
      if (!isTlsOrAbortedError(lastError) || attempt >= GMAIL_TLS_RETRY_DELAYS_MS.length) {
        throw err instanceof Error ? err : new Error(lastError);
      }
      console.error(
        JSON.stringify({ gmailRetry: label, attempt: attempt + 1, waitMs: GMAIL_TLS_RETRY_DELAYS_MS[attempt] }),
      );
      await sleep(GMAIL_TLS_RETRY_DELAYS_MS[attempt]);
    }
  }
  throw new Error(lastError);
}

function toScope(orgId: string, userEmail: string, userId?: string | null): MailboxScope {
  return { companyId: orgId, email: userEmail.toLowerCase(), userId: userId ?? null };
}

export type E2eEmailBackupProgress = {
  runId: string;
  phase: "fetching" | "uploading" | "done" | "error";
  message: string;
  fetched: number;
  uploaded: number;
  total: number;
};

export async function listEmailBackupRuns(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  limit = 20,
  userId?: string | null,
) {
  const db = getSupabaseAdmin() || supabase;
  const scope = toScope(orgId, userEmail, userId);
  let runQuery = db.from("email_backup_runs").select("*");
  if (scope.userId) runQuery = runQuery.eq("user_id", scope.userId);
  else runQuery = runQuery.eq("company_id", scope.companyId).eq("email", scope.email);
  const { data, error } = await runQuery.order("created_at", { ascending: false }).limit(limit);

  if (error) {
    console.error(error.message);
    return {
      runs: [] as Record<string, unknown>[],
      tableMissing: relationMissing(error.message),
      supabaseError: error.message,
    };
  }
  return { runs: data || [], tableMissing: false, supabaseError: null as string | null };
}

export async function listFileArchives(
  supabase: SupabaseClient,
  orgId: string,
  limit = 50,
  userEmail?: string,
  userId?: string | null,
) {
  const rows = await selectArchiveRows(supabase, orgId, userEmail, limit, undefined, userId);
  if (rows.supabaseError) {
    return {
      archives: [] as Record<string, unknown>[],
      tableMissing: rows.missing,
      supabaseError: rows.supabaseError,
    };
  }
  return { archives: rows.data.map(normalizeArchiveRow), tableMissing: false, supabaseError: null as string | null };
}

export async function orgArchiveStorageTotals(
  supabase: SupabaseClient,
  orgId: string,
  userEmail?: string,
  userId?: string | null,
) {
  return sumFileArchiveStorage(supabase, orgId, userEmail, userId);
}

/** Sum all file_archives rows (paginated) — not capped at 1000. */
export async function sumFileArchiveStorage(
  supabase: SupabaseClient,
  orgId: string,
  userEmail?: string,
  userId?: string | null,
) {
  const db = getSupabaseAdmin() || supabase;
  const pageSize = 1000;
  let from = 0;
  let totalMb = 0;
  let fileCount = 0;
  const scope = userEmail ? toScope(orgId, userEmail, userId) : null;

  for (;;) {
    let query = db.from("file_archives").select("size_mb, size_bytes, size");
    if (scope) {
      query = scope.userId
        ? query.eq("user_id", scope.userId)
        : query.eq("company_id", scope.companyId).eq("email", scope.email);
    } else query = query.eq("company_id", orgId);
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) {
      console.error(error.message);
      break;
    }
    const rows = data || [];
    if (!rows.length) break;
    for (const row of rows) {
      totalMb += archiveRowMb(row as Record<string, unknown>);
    }
    fileCount += rows.length;
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  if (userEmail && fileCount === 0) {
    fileCount = await countBackedUpEmails(supabase, orgId, userEmail, userId);
  }

  return { totalMb, fileCount };
}

export async function countBackedUpEmails(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  userId?: string | null,
) {
  const db = getSupabaseAdmin() || supabase;
  const scope = toScope(orgId, userEmail, userId);
  const base = db.from("file_archives").select("id", { count: "exact", head: true });
  const { count, error } = scope.userId
    ? await base.eq("user_id", scope.userId)
    : await base.eq("company_id", scope.companyId).eq("email", scope.email);
  if (error) {
    console.error(error.message);
    return 0;
  }
  return count || 0;
}

export async function orgEmailBackupTotals(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase
    .from("email_backup_runs")
    .select("email_count, size_mb")
    .eq("org_id", orgId)
    .eq("status", "completed");

  const runs = data || [];
  return {
    totalEmails: runs.reduce((n, r) => n + (Number(r.email_count) || 0), 0),
    totalMb: runs.reduce((n, r) => n + (Number(r.size_mb) || 0), 0),
    runCount: runs.length,
  };
}

function missingColumn(message: string) {
  return message.match(/Could not find the '([^']+)' column/i)?.[1] || null;
}

/** Live progress is an integer percent. Drop or coerce values the table cannot store. */
function adaptPayload(message: string, payload: Record<string, unknown>) {
  const column = missingColumn(message);
  if (column && column in payload) {
    delete payload[column];
    return true;
  }

  const quoted = message.match(/invalid input syntax for type integer: "((?:\\.|[^"\\])*)"/i)?.[1];
  if (!quoted) return false;
  const key = Object.keys(payload).find((name) => String(payload[name]) === quoted);
  if (!key) return false;
  if (key === "progress") {
    payload.progress = 0;
    return true;
  }
  const numeric = Number(payload[key]);
  if (Number.isFinite(numeric)) {
    payload[key] = Math.round(numeric);
    return true;
  }
  delete payload[key];
  return true;
}

function runCountPatch(uploaded: number, sizeMb: number) {
  const n = Math.max(0, Math.floor(uploaded));
  return {
    email_count: n,
    archived_count: n,
    size_mb: sizeMb,
  };
}

async function insertRun(supabase: SupabaseClient, row: Record<string, unknown>) {
  const db = getSupabaseAdmin() || supabase;
  let payload = { ...row, email_count: 0, archived_count: 0 };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await db.from("email_backup_runs").insert(payload).select("id").single();
    if (!result.error) return result;
    console.error(result.error.message);
    if (!adaptPayload(result.error.message, payload)) return result;
  }
  return { data: null, error: { message: "email_backup_runs insert failed" } };
}

async function patchRun(
  supabase: SupabaseClient,
  runId: string,
  patch: Record<string, unknown>,
) {
  const db = getSupabaseAdmin() || supabase;
  let payload = { ...patch };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await db.from("email_backup_runs").update(payload).eq("id", runId);
    if (!error) return;
    console.error(error.message);
    if (!adaptPayload(error.message, payload)) return;
  }
}

/** Resume Gmail list after the last completed backup run. */
export async function getLastGmailPageToken(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  userId?: string | null,
): Promise<string | null> {
  const db = getSupabaseAdmin() || supabase;
  const scope = toScope(orgId, userEmail, userId);
  const tokenBase = db
    .from("email_backup_runs")
    .select("gmail_page_token, progress")
    .eq("status", "completed");
  const tokenQuery = scope.userId
    ? tokenBase.eq("user_id", scope.userId)
    : tokenBase.eq("company_id", scope.companyId).eq("email", scope.email);
  const { data, error } = await tokenQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error(error.message);
    return null;
  }

  const columnToken = typeof data?.gmail_page_token === "string" ? data.gmail_page_token.trim() : "";
  if (columnToken) return columnToken;

  const progress = String(data?.progress || "");
  const embedded = progress.match(/__pt:([^\s|]+)/)?.[1]?.trim();
  return embedded || null;
}

/** All Gmail message IDs already stored in file_archives for this mailbox. */
export async function loadAllArchivedGmailIds(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  userId?: string | null,
): Promise<Set<string>> {
  const db = getSupabaseAdmin() || supabase;
  const archived = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  const scope = toScope(orgId, userEmail, userId);

  for (;;) {
    const idBase = db.from("file_archives").select("file_name, source, gmail_message_id");
    const idQuery = scope.userId
      ? idBase.eq("user_id", scope.userId)
      : idBase.eq("company_id", scope.companyId).eq("email", scope.email);
    const { data, error } = await idQuery.range(from, from + pageSize - 1);

    if (error) {
      console.error(error.message);
      break;
    }
    const rows = data || [];
    if (!rows.length) break;

    for (const row of rows) {
      const source = String(row.source || "").toLowerCase();
      if (source && source !== "gmail") continue;
      const mid = String(row.gmail_message_id || "").trim();
      if (mid) {
        archived.add(mid);
        continue;
      }
      const name = String(row.file_name || "");
      if (!name.endsWith(".eml")) continue;
      archived.add(name.slice(0, -4));
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return archived;
}

export type E2eEmailBackupBatch = {
  limit?: number;
  maxMessages?: number;
  pageToken?: string;
  offset?: number;
  batch?: number;
  /** Cron only. Limits the Gmail query to recent mail. */
  newerThanDays?: number;
  /** Gmail search q= string (e.g. after:2026/10/22). */
  gmailSearchQuery?: string;
};

/** Gmail `after:` date from last completed backup run (UTC date). */
export function buildGmailQuerySince(lastRunIso: string | null, newerThanDays?: number): string | undefined {
  if (lastRunIso) {
    const d = new Date(lastRunIso);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `after:${y}/${m}/${day}`;
    }
  }
  if (newerThanDays != null && newerThanDays > 0) return `newer_than:${newerThanDays}d`;
  return "newer_than:1d";
}

export async function getLastEmailBackupRunAt(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  userId?: string | null,
): Promise<string | null> {
  const db = getSupabaseAdmin() || supabase;
  const scope = toScope(orgId, userEmail, userId);
  let query = db.from("email_backup_runs").select("created_at").eq("status", "completed");
  if (scope.userId) query = query.eq("user_id", scope.userId);
  else query = query.eq("company_id", scope.companyId).eq("email", scope.email);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error(error.message);
    return null;
  }
  return (data?.created_at as string) || null;
}

export async function runE2eGmailBackup(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    email: string;
    maxMessages?: number;
    limit?: number;
    pageToken?: string;
    offset?: number;
    batch?: number;
    newerThanDays?: number;
    gmailSearchQuery?: string;
    userId?: string | null;
    onProgress?: (p: E2eEmailBackupProgress) => void;
  },
): Promise<
  | {
      ok: true;
      runId: string;
      emailCount: number;
      processed: number;
      alreadyArchived: number;
      sizeMb: number;
      s3Path: string;
      nextPageToken: string | null;
      done: boolean;
      hasMore: boolean;
      nextOffset: number;
      resultSizeEstimate: number;
      messagesTotal: number;
      batch: number;
    }
  | { ok: false; error: string; runId?: string; retryable?: boolean; tokenExpired?: boolean; needsReconnect?: boolean }
> {
  if (!isS3Configured()) {
    return {
      ok: false,
      error: "E2E Chennai storage not configured — set E2E_ENDPOINT, E2E_ACCESS_KEY, and E2E_SECRET_KEY on the host.",
    };
  }

  const email = opts.email.toLowerCase();
  const scope = await resolveMailboxScope(supabase, opts.companyId, email);
  const orgId = scope.companyId;
  const userId = opts.userId ?? scope.userId;
  if (!userId) {
    return {
      ok: false,
      error: "Could not resolve user_id for this mailbox (company_users row missing).",
    };
  }
  const requested = opts.limit ?? opts.maxMessages ?? DEFAULT_MAX;
  const maxMessages = Math.min(MAX_CAP, Math.max(1, requested));
  const batch = Math.max(1, opts.batch ?? 1);
  const storedToken = await getLastGmailPageToken(supabase, orgId, email, userId);
  const pageToken = (opts.pageToken?.trim() || storedToken || undefined) as string | undefined;
  const offset = pageToken ? 0 : Math.max(0, opts.offset ?? 0);
  const now = new Date();
  const prefix = `gmail/${email}/${now.getUTCFullYear()}/`;
  const bucket = (getE2EBucket() || EMAIL_BACKUP_S3_BUCKET).replace(/\s+/g, "");
  const endpoint = resolveE2EEndpoint();
  console.error("E2E_DEBUG", { endpoint, bucket, file: prefix, companyId: orgId, email });

  const { data: runRow, error: insertErr } = await insertRun(supabase, {
    company_id: orgId,
    email,
    ...(userId ? { user_id: userId } : {}),
    status: "running",
    progress: "starting",
  });

  if (insertErr || !runRow?.id) {
    return {
      ok: false,
      error: insertErr?.message || "Could not create archive run (apply migration 027).",
    };
  }

  const runId = runRow.id as string;
  const emit = (p: Partial<E2eEmailBackupProgress> & Pick<E2eEmailBackupProgress, "phase" | "message">) => {
    const full: E2eEmailBackupProgress = {
      runId,
      phase: p.phase,
      message: p.message,
      fetched: p.fetched ?? 0,
      uploaded: p.uploaded ?? 0,
      total: p.total ?? maxMessages,
    };
    opts.onProgress?.(full);
  };

  const counted = await gmailMailboxCount(supabase, orgId, email);
  if ("error" in counted) {
    await patchRun(supabase, runId, { status: "error", progress: counted.error.slice(0, 400) });
    return {
      ok: false,
      error: counted.error,
      runId,
      tokenExpired: counted.tokenExpired,
      needsReconnect: Boolean(counted.needsReconnect) || isGmailReconnectError(counted.error),
    };
  }
  const gmail = counted.gmail;
  const mailboxTotal = counted.messagesTotal;

  emit({
    phase: "fetching",
    message: `Gmail mailbox has ${mailboxTotal} messages`,
    total: mailboxTotal,
  });
  await patchRun(supabase, runId, { progress: "fetching" });

  if (mailboxTotal === 0) {
    await patchRun(supabase, runId, {
      status: "completed",
      progress: "Archived 0",
      ...runCountPatch(0, 0),
    });
    return {
      ok: true,
      runId,
      emailCount: 0,
      processed: 0,
      alreadyArchived: 0,
      sizeMb: 0,
      s3Path: prefix,
      nextPageToken: null,
      done: true,
      hasMore: false,
      nextOffset: offset,
      resultSizeEstimate: 0,
      messagesTotal: 0,
      batch,
    };
  }

  let uploaded = 0;
  let bytes = 0;
  let resumeGmailToken: string | null = pageToken || null;

  try {
    const archivedIds = await loadAllArchivedGmailIds(supabase, orgId, email, userId);
    const slice = await withTlsRetry("Gmail list", () =>
      collectNewGmailMessages(gmail, {
      archived: archivedIds,
      limit: maxMessages,
      pageToken,
      maxPages: GMAIL_LIST_MAX_PAGES,
        q:
          opts.gmailSearchQuery ??
          (opts.newerThanDays ? `newer_than:${opts.newerThanDays}d` : undefined),
      }),
    );
    const messages = slice.messages;
    const resultSizeEstimate = mailboxTotal;
    resumeGmailToken = slice.nextPageToken ?? resumeGmailToken;

    let alreadyArchived = slice.skippedArchived;

    let processedInBatch = 0;
    for (let i = 0; i < messages.length && processedInBatch < maxMessages; i++) {
      const id = messages[i].id;
      if (!id) continue;
      processedInBatch += 1;
      if (archivedIds.has(id)) {
        alreadyArchived += 1;
        continue;
      }

      const rawEmail = await fetchRawMessage(gmail, id);

      emit({
        phase: "uploading",
        message: `Archiving to ${bucket}/${prefix} (${uploaded + 1}/${maxMessages})`,
        fetched: processedInBatch,
        uploaded,
        total: maxMessages,
      });

      const archived = await withTlsRetry("E2E Gmail upload", async () => {
        const result = await archiveGmailEml({
          orgId,
          userId,
          userEmail: email,
          messageId: id,
          body: rawEmail,
          supabase,
        });
        if (!result.ok) throw new Error(result.error);
        return result;
      });

      uploaded += 1;
      bytes += rawEmail.length;

      await patchRun(supabase, runId, {
        progress: `Archived ${uploaded}`,
        ...runCountPatch(uploaded, bytes / (1024 * 1024)),
      });
    }

    const sizeMb = bytes / (1024 * 1024);
    const nextOffset = offset + processedInBatch;
    const nextPageToken = slice.nextPageToken;
    resumeGmailToken = nextPageToken ?? resumeGmailToken;
    const totalArchivedNow = archivedIds.size + uploaded;
    const hasMore =
      Boolean(nextPageToken) ||
      slice.hasMore ||
      (totalArchivedNow < mailboxTotal && (processedInBatch > 0 || alreadyArchived > 0));
    const done = totalArchivedNow >= mailboxTotal || (!nextPageToken && !slice.hasMore);
    const estimate = Math.max(resultSizeEstimate, nextOffset);
    console.log(
      `Batch ${batch} archived ${uploaded} emails (${processedInBatch} new ids, ${alreadyArchived} skipped, token=${nextPageToken ? "yes" : "no"})`,
    );
    const progressText =
      nextPageToken && nextPageToken.length > 0
        ? `Archived ${uploaded} __pt:${nextPageToken}`
        : `Archived ${uploaded}`;
    await patchRun(supabase, runId, {
      status: "completed",
      progress: progressText.slice(0, 400),
      gmail_page_token: nextPageToken,
      ...runCountPatch(uploaded, sizeMb),
    });

    emit({
      phase: "done",
      message: `Archiving ${nextOffset}/${estimate}...`,
      fetched: processedInBatch,
      uploaded,
      total: estimate,
    });

    return {
      ok: true,
      runId,
      emailCount: uploaded,
      processed: processedInBatch,
      alreadyArchived,
      sizeMb,
      s3Path: prefix,
      nextPageToken,
      done,
      hasMore,
      nextOffset,
      resultSizeEstimate: estimate,
      messagesTotal: mailboxTotal,
      batch,
    };
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Gmail archive failed";
    if (isGmailReconnectError(msg)) {
      await patchRun(supabase, runId, { status: "error", progress: msg.slice(0, 400) });
      emit({ phase: "error", message: msg });
      return { ok: false, error: msg, runId, tokenExpired: true, needsReconnect: true };
    }
    const retryable = isTlsOrAbortedError(msg);
    const tokenExpired = /Gmail access expired|invalid_grant|reconnect Gmail/i.test(msg);
    if (tokenExpired) {
      msg = "Gmail access expired. Reconnect Gmail.";
    } else if (/insufficient.*scope|403|Forbidden/i.test(msg)) {
      msg =
        "Gmail permission missing — reconnect Google and allow Gmail read/modify on the consent screen.";
    }
    if (retryable && resumeGmailToken) {
      await patchRun(supabase, runId, {
        status: "completed",
        gmail_page_token: resumeGmailToken,
        progress: `Paused (network) — uploaded ${uploaded} __pt:${resumeGmailToken}`.slice(0, 400),
        ...runCountPatch(uploaded, bytes / (1024 * 1024)),
      });
      emit({ phase: "error", message: msg });
      return { ok: false, error: msg, runId, retryable: true, tokenExpired };
    }
    await patchRun(supabase, runId, { status: "error", progress: msg.slice(0, 400) });
    emit({ phase: "error", message: msg });
    return { ok: false, error: msg, runId, retryable, tokenExpired };
  }
}

export async function gmailMailboxCount(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<
  | { messagesTotal: number; gmail: NonNullable<ReturnType<typeof gmailClient>>; mailboxEmail?: string }
  | { error: string; tokenExpired?: boolean; needsReconnect?: boolean }
> {
  const normalized = email.toLowerCase();
  let accessToken: string | null;
  try {
    accessToken = await getValidGoogleAccessToken(supabase, companyId, normalized, {
      mailboxOnly: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail token refresh failed";
    return {
      error: message,
      tokenExpired: /expired|reconnect/i.test(message),
      needsReconnect: isGmailReconnectError(message),
    };
  }
  if (!accessToken) {
    return {
      error: "Connect Gmail with mail access for this account first.",
      tokenExpired: true,
      needsReconnect: true,
    };
  }

  let gmail = gmailClient(accessToken);
  if (!gmail) return { error: "Gmail client unavailable" };

  let profile = await readGmailProfile(gmail, normalized);
  if ("tokenExpired" in profile && profile.tokenExpired) {
    try {
      accessToken = await getValidGoogleAccessToken(supabase, companyId, normalized, {
        force: true,
        mailboxOnly: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gmail token refresh failed";
      return { error: message, tokenExpired: true, needsReconnect: isGmailReconnectError(message) };
    }
    if (!accessToken) return { error: "Gmail access expired. Reconnect Gmail.", tokenExpired: true };
    gmail = gmailClient(accessToken);
    if (!gmail) return { error: "Gmail client unavailable" };
    profile = await readGmailProfile(gmail, normalized);
  }
  if ("error" in profile) return profile;
  return {
    messagesTotal: profile.messagesTotal,
    gmail,
    mailboxEmail: profile.mailboxEmail,
  };
}

async function readGmailProfile(
  gmail: NonNullable<ReturnType<typeof gmailClient>>,
  expectedEmail: string,
): Promise<
  { messagesTotal: number; mailboxEmail: string } | { error: string; tokenExpired?: boolean }
> {
  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    const mailboxEmail = String(profile.data.emailAddress || "").toLowerCase();
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 1 });
    const estimate = Number(list.data.resultSizeEstimate);
    console.log(
      "[gmail] users.getProfile",
      JSON.stringify({
        emailAddress: mailboxEmail || null,
        messagesTotal: profile.data.messagesTotal ?? null,
        resultSizeEstimate: list.data.resultSizeEstimate ?? null,
        threadsTotal: profile.data.threadsTotal ?? null,
      }),
    );
    if (mailboxEmail && mailboxEmail !== expectedEmail.toLowerCase()) {
      return {
        error: `Gmail is connected as ${mailboxEmail}, not ${expectedEmail}. Reconnect Gmail for this user.`,
        tokenExpired: true,
      };
    }
    const profileTotal = Number(profile.data.messagesTotal);
    const total =
      Number.isFinite(estimate) && estimate >= 0
        ? estimate
        : Number.isFinite(profileTotal)
          ? profileTotal
          : NaN;
    if (!Number.isFinite(total)) {
      return { error: "Gmail mailbox count failed. The profile response had no messagesTotal." };
    }
    return { messagesTotal: total, mailboxEmail: mailboxEmail || expectedEmail };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail profile request failed";
    const status =
      err && typeof err === "object" && "code" in err ? Number((err as { code?: number }).code) : 0;
    console.log("[gmail] users.getProfile failed", JSON.stringify({ message, status: status || null }));
    const tokenExpired = status === 401 || /invalid_grant|unauthorized|login required/i.test(message);
    return {
      error: tokenExpired
        ? "Gmail access expired. Reconnect Gmail."
        : `Gmail mailbox count failed: ${message}`,
      tokenExpired,
    };
  }
}

/** List Gmail pages until we have up to `limit` message IDs not yet in file_archives. */
async function collectNewGmailMessages(
  gmail: NonNullable<ReturnType<typeof gmailClient>>,
  opts: {
    archived: Set<string>;
    limit: number;
    pageToken?: string;
    maxPages?: number;
    q?: string;
  },
) {
  const maxPages = opts.maxPages ?? GMAIL_LIST_MAX_PAGES;
  const collected: { id: string }[] = [];
  let token: string | undefined = opts.pageToken?.trim() || undefined;
  let skippedArchived = 0;
  let hasMore = false;
  let nextPageToken: string | null = null;

  for (let page = 0; page < maxPages && collected.length < opts.limit; page += 1) {
    const pageStartToken = token;
    const list = await gmail.users.messages.list(
      {
        userId: "me",
        maxResults: 100,
        ...(token ? { pageToken: token } : {}),
        ...(opts.q ? { q: opts.q } : {}),
      },
      { timeout: GMAIL_API_TIMEOUT_MS },
    );
    const messages = list.data.messages || [];
    const nextToken = list.data.nextPageToken || undefined;
    console.log(
      "[gmail] users.messages.list",
      JSON.stringify({
        pageStartToken: pageStartToken || null,
        returned: messages.length,
        hasNextPage: Boolean(nextToken),
        newCollected: collected.length,
      }),
    );

    if (!messages.length) {
      hasMore = false;
      nextPageToken = null;
      break;
    }

    let hitLimitMidPage = false;
    for (const message of messages) {
      if (!message.id) continue;
      if (opts.archived.has(message.id)) {
        skippedArchived += 1;
        continue;
      }
      collected.push({ id: message.id });
      if (collected.length >= opts.limit) {
        hitLimitMidPage = true;
        break;
      }
    }

    if (hitLimitMidPage) {
      nextPageToken = pageStartToken || null;
      hasMore = true;
      break;
    }

    nextPageToken = nextToken || null;
    hasMore = Boolean(nextToken);
    token = nextToken;
    if (!token) break;
  }

  if (collected.length < opts.limit && hasMore && nextPageToken) {
    hasMore = true;
  } else if (!nextPageToken && collected.length === 0) {
    hasMore = false;
  }

  return {
    messages: collected,
    hasMore,
    nextPageToken,
    skippedArchived,
  };
}

async function selectArchiveRows(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string | undefined,
  limit: number,
  fileNames?: string[],
  userId?: string | null,
) {
  const db = getSupabaseAdmin() || supabase;
  let query = db.from("file_archives").select("*");
  if (userEmail) {
    const rowScope = toScope(orgId, userEmail, userId);
    query = rowScope.userId
      ? query.eq("user_id", rowScope.userId)
      : query.eq("company_id", rowScope.companyId).eq("email", rowScope.email);
  } else {
    query = query.eq("company_id", orgId);
  }
  if (fileNames?.length) query = query.in("file_name", fileNames);
  else query = query.order("created_at", { ascending: false });
  const result = await query.limit(limit);
  if (result.error) {
    console.error(result.error.message);
    return {
      data: [] as Record<string, unknown>[],
      missing: relationMissing(result.error.message),
      supabaseError: result.error.message,
    };
  }
  return { data: result.data || [], missing: false, supabaseError: null as string | null };
}

function relationMissing(message: string) {
  return /does not exist/i.test(message) && !/column/i.test(message);
}

function archiveRowMb(row: Record<string, unknown>) {
  if (row.size_mb != null && row.size_mb !== "") return Number(row.size_mb) || 0;
  if (row.size_bytes != null) return (Number(row.size_bytes) || 0) / (1024 * 1024);
  return Number(row.size) || 0;
}

function normalizeArchiveRow(row: Record<string, unknown>) {
  return {
    ...row,
    s3_key: row.s3_key || row.s3_path || row.e2e_path || "",
    s3_bucket: row.s3_bucket || "",
    storage_class: row.storage_class || row.class || "",
    archived_at: row.archived_at || row.created_at || null,
    size_mb: archiveRowMb(row),
    is_from_start: row.is_from_start ?? true,
  };
}

async function fetchRawMessage(
  gmail: NonNullable<ReturnType<typeof gmailClient>>,
  id: string,
) {
  return withTlsRetry("Gmail message get", async () => {
    const full = await gmail.users.messages.get(
      {
        userId: "me",
        id,
        format: "raw",
      },
      { timeout: GMAIL_API_TIMEOUT_MS },
    );
    const rawB64 = full.data.raw;
    if (!rawB64) throw new Error("Gmail returned an empty message");
    return Buffer.from(rawB64, "base64url");
  });
}

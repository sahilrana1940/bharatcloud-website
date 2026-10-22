import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { gmailClient } from "@/lib/google/client";
import {
  ARCHIVER_BUCKET,
  archiveGmailEml,
  emailArchivePrefix,
} from "@/lib/storage/archiver-from-start";
import { getE2EBucket, isS3Configured } from "@/lib/s3/config";

export const EMAIL_BACKUP_S3_BUCKET = ARCHIVER_BUCKET;

const DEFAULT_MAX = 25;
const MAX_CAP = 50;

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
) {
  const { data, error } = await supabase
    .from("email_backup_runs")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_email", userEmail.toLowerCase())
    .order("backup_date", { ascending: false })
    .limit(limit);

  if (error && /does not exist|schema cache/i.test(error.message)) {
    return { runs: [] as Record<string, unknown>[], tableMissing: true };
  }
  return { runs: data || [], tableMissing: false };
}

export async function listFileArchives(
  supabase: SupabaseClient,
  orgId: string,
  limit = 50,
  userEmail?: string,
) {
  const rows = await selectArchiveRows(supabase, orgId, userEmail, limit);
  if (rows.missing) return { archives: [] as Record<string, unknown>[], tableMissing: true };
  return { archives: rows.data.map(normalizeArchiveRow), tableMissing: false };
}

export async function orgArchiveStorageTotals(
  supabase: SupabaseClient,
  orgId: string,
  userEmail?: string,
) {
  const rows = await selectArchiveRows(supabase, orgId, userEmail, 1000);
  const totalMb = rows.data.reduce((n, row) => n + archiveRowMb(row), 0);
  return { totalMb, fileCount: rows.data.length };
}

export async function countBackedUpEmails(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
) {
  const { data } = await supabase
    .from("email_backup_runs")
    .select("email_count")
    .eq("org_id", orgId)
    .eq("user_email", userEmail.toLowerCase())
    .eq("status", "completed");

  if (!data?.length) return 0;
  return data.reduce((n, r) => n + (Number(r.email_count) || 0), 0);
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

async function insertRun(supabase: SupabaseClient, row: Record<string, unknown>) {
  const payload = { ...row };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabase.from("email_backup_runs").insert(payload).select("id").single();
    if (!result.error) return result;
    if (!adaptPayload(result.error.message, payload)) return result;
  }
  return supabase.from("email_backup_runs").insert(payload).select("id").single();
}

async function patchRun(
  supabase: SupabaseClient,
  runId: string,
  patch: Record<string, unknown>,
) {
  const payload = { ...patch };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("email_backup_runs").update(payload).eq("id", runId);
    if (!error) return;
    if (!adaptPayload(error.message, payload)) return;
  }
}

export type E2eEmailBackupBatch = {
  limit?: number;
  maxMessages?: number;
  pageToken?: string;
  offset?: number;
  batch?: number;
  /** Cron only. Limits the Gmail query to recent mail. */
  newerThanDays?: number;
};

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
      batch: number;
    }
  | { ok: false; error: string; runId?: string; retryable?: boolean }
> {
  if (!isS3Configured()) {
    return {
      ok: false,
      error: "E2E Chennai storage not configured — set E2E_ENDPOINT, E2E_ACCESS_KEY, and E2E_SECRET_KEY on the host.",
    };
  }

  const email = opts.email.toLowerCase();
  const orgId = await resolveArchiveCompanyId(supabase, opts.companyId, email);
  const requested = opts.limit ?? opts.maxMessages ?? DEFAULT_MAX;
  const maxMessages = Math.min(MAX_CAP, Math.max(1, requested));
  const batch = Math.max(1, opts.batch ?? 1);
  const pageToken = opts.pageToken?.trim() || undefined;
  const offset = Math.max(0, opts.offset ?? 0);
  const now = new Date();
  const prefix = emailArchivePrefix(orgId, now);
  const bucket = getE2EBucket() || EMAIL_BACKUP_S3_BUCKET;

  const { data: runRow, error: insertErr } = await insertRun(supabase, {
    org_id: orgId,
    user_email: email,
    s3_bucket: bucket,
    s3_path: prefix,
    status: "running",
    progress: 0,
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

  const accessToken = await getValidGoogleAccessToken(supabase, orgId, email);
  if (!accessToken) {
    await patchRun(supabase, runId, {
      status: "error",
      progress: 0,
    });
    return { ok: false, error: "Connect Gmail with mail access first.", runId };
  }

  const gmail = gmailClient(accessToken);
  if (!gmail) {
    await patchRun(supabase, runId, { status: "error", progress: 0 });
    return { ok: false, error: "Gmail client unavailable", runId };
  }

  emit({
    phase: "fetching",
    message: `Fetching up to ${maxMessages} emails (archive copy only)…`,
    total: maxMessages,
  });
  await patchRun(supabase, runId, { progress: 0 });

  try {
    const slice = await listMessageWindow(gmail, {
      offset: pageToken ? 0 : offset,
      limit: maxMessages,
      pageToken,
      q: opts.newerThanDays ? `newer_than:${opts.newerThanDays}d` : undefined,
    });
    const messages = slice.messages;
    const nextPageToken = pageToken ? slice.nextPageToken : null;
    const hasMore = slice.hasMore;
    const resultSizeEstimate = Math.max(slice.resultSizeEstimate, offset + messages.length);
    const total = messages.length;
    const already = await archivedMessageIds(
      supabase,
      orgId,
      email,
      messages.map((m) => m.id).filter((id): id is string => Boolean(id)),
    );

    let uploaded = 0;
    let alreadyArchived = 0;
    let bytes = 0;

    for (let i = 0; i < messages.length; i++) {
      const id = messages[i].id;
      if (!id) continue;
      if (already.has(id)) {
        alreadyArchived += 1;
        continue;
      }

      const rawEmail = await fetchRawMessage(gmail, id);

      emit({
        phase: "uploading",
        message: `Archiving to ${bucket}/${prefix} (${uploaded + 1}/${total})`,
        fetched: i + 1,
        uploaded,
        total,
      });

      const archived = await archiveGmailEml({
        orgId,
        userEmail: email,
        messageId: id,
        body: rawEmail,
        supabase,
      });
      if (!archived.ok) throw new Error(archived.error);

      uploaded += 1;
      bytes += rawEmail.length;

      await patchRun(supabase, runId, {
        progress: total > 0 ? Math.round(((uploaded + alreadyArchived) / total) * 100) : 0,
        email_count: uploaded,
        size_mb: Math.round((bytes / (1024 * 1024)) * 100) / 100,
      });
    }

    const sizeMb = bytes / (1024 * 1024);
    const nextOffset = offset + total;
    const estimate = Math.max(resultSizeEstimate, nextOffset);
    console.log(`Batch ${batch} archived ${uploaded} emails`);
    await patchRun(supabase, runId, {
      status: "completed",
      email_count: uploaded,
      size_mb: Math.round(sizeMb * 100) / 100,
      s3_path: prefix,
      progress: 100,
    });

    emit({
      phase: "done",
      message: `Archiving ${nextOffset}/${estimate}...`,
      fetched: total,
      uploaded,
      total: estimate,
    });

    return {
      ok: true,
      runId,
      emailCount: uploaded,
      processed: total,
      alreadyArchived,
      sizeMb,
      s3Path: prefix,
      nextPageToken,
      done: !hasMore,
      hasMore,
      nextOffset,
      resultSizeEstimate: estimate,
      batch,
    };
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Gmail archive failed";
    const retryable = /socket hang up|ECONNRESET|ETIMEDOUT|Timeout|aborted/i.test(msg);
    if (/insufficient.*scope|403|Forbidden/i.test(msg)) {
      msg =
        "Gmail permission missing — reconnect Google and allow Gmail read/modify on the consent screen.";
    }
    await patchRun(supabase, runId, { status: "error", progress: 0 });
    emit({ phase: "error", message: msg });
    return { ok: false, error: msg, runId, retryable };
  }
}

async function listMessageWindow(
  gmail: NonNullable<ReturnType<typeof gmailClient>>,
  opts: { offset: number; limit: number; pageToken?: string; q?: string },
) {
  const collected: { id: string }[] = [];
  let skipped = 0;
  let token = opts.pageToken;
  let estimate = 0;
  let hasMore = false;

  for (let page = 0; page < 200 && collected.length < opts.limit; page += 1) {
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
      ...(token ? { pageToken: token } : {}),
      ...(opts.q ? { q: opts.q } : {}),
    });
    const messages = list.data.messages || [];
    estimate = Math.max(estimate, Number(list.data.resultSizeEstimate) || 0);
    token = list.data.nextPageToken || undefined;
    if (!messages.length) {
      hasMore = false;
      break;
    }

    for (const message of messages) {
      if (!message.id) continue;
      if (skipped < opts.offset) {
        skipped += 1;
        continue;
      }
      if (collected.length >= opts.limit) {
        hasMore = true;
        break;
      }
      collected.push({ id: message.id });
    }

    if (collected.length >= opts.limit) {
      hasMore = hasMore || Boolean(token);
      break;
    }
    if (!token) {
      hasMore = false;
      break;
    }
  }

  return {
    messages: collected,
    hasMore,
    nextPageToken: token || null,
    resultSizeEstimate: estimate,
  };
}

async function archivedMessageIds(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string,
  ids: string[],
) {
  const found = new Set<string>();
  if (!ids.length) return found;
  const names = ids.map((id) => `${id}.eml`);
  const rows = await selectArchiveRows(supabase, orgId, userEmail, names.length, names);
  for (const row of rows.data) {
    const name = String(row.file_name || "");
    if (name.endsWith(".eml")) found.add(name.slice(0, -4));
  }
  return found;
}

async function selectArchiveRows(
  supabase: SupabaseClient,
  orgId: string,
  userEmail: string | undefined,
  limit: number,
  fileNames?: string[],
) {
  const run = (column: "org_id" | "user_email", value: string) => {
    const query = supabase.from("file_archives").select("*").eq(column, value);
    if (fileNames?.length) return query.in("file_name", fileNames).limit(limit);
    return query.order("archived_at", { ascending: false }).limit(limit);
  };

  const byOrg = await run("org_id", orgId);
  if (!byOrg.error) return { data: byOrg.data || [], missing: false };
  const missingColumn = /Could not find the 'org_id' column|schema cache/i.test(byOrg.error.message);
  if (!missingColumn || !userEmail) {
    console.log(
      "[file_archives] select error",
      JSON.stringify({ message: byOrg.error.message, code: byOrg.error.code }),
    );
    return { data: [] as Record<string, unknown>[], missing: /does not exist/i.test(byOrg.error.message) };
  }

  const byUser = await run("user_email", userEmail.toLowerCase());
  if (byUser.error) {
    console.log(
      "[file_archives] select error",
      JSON.stringify({ message: byUser.error.message, code: byUser.error.code }),
    );
    return { data: [] as Record<string, unknown>[], missing: /does not exist/i.test(byUser.error.message) };
  }
  return { data: byUser.data || [], missing: false };
}

function archiveRowMb(row: Record<string, unknown>) {
  if (row.size_mb != null && row.size_mb !== "") return Number(row.size_mb) || 0;
  if (row.size_bytes != null) return (Number(row.size_bytes) || 0) / (1024 * 1024);
  return Number(row.size) || 0;
}

function normalizeArchiveRow(row: Record<string, unknown>) {
  return {
    ...row,
    s3_key: row.s3_key || row.e2e_path || "",
    s3_bucket: row.s3_bucket || "",
    storage_class: row.storage_class || row.class || "",
    size_mb: archiveRowMb(row),
    is_from_start: row.is_from_start ?? true,
  };
}

async function fetchRawMessage(
  gmail: NonNullable<ReturnType<typeof gmailClient>>,
  id: string,
) {
  let lastError = "Gmail fetch failed";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "raw",
      });
      const rawB64 = full.data.raw;
      if (!rawB64) throw new Error("Gmail returned an empty message");
      return Buffer.from(rawB64, "base64url");
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Gmail fetch failed";
      if (!/socket hang up|ECONNRESET|ETIMEDOUT|Timeout|aborted/i.test(lastError) || attempt === 3) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw new Error(lastError);
}

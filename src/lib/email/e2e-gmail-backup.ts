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

const DEFAULT_MAX = 100;
const MAX_CAP = 1000;

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
) {
  const { data, error } = await supabase
    .from("file_archives")
    .select("*")
    .eq("org_id", orgId)
    .order("archived_at", { ascending: false })
    .limit(limit);

  if (error && /does not exist|schema cache/i.test(error.message)) {
    return { archives: [] as Record<string, unknown>[], tableMissing: true };
  }
  return { archives: data || [], tableMissing: false };
}

export async function orgArchiveStorageTotals(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase
    .from("file_archives")
    .select("size_mb")
    .eq("org_id", orgId);

  const rows = data || [];
  const totalMb = rows.reduce((n, r) => n + (Number(r.size_mb) || 0), 0);
  return { totalMb, fileCount: rows.length };
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

export async function runE2eGmailBackup(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    email: string;
    maxMessages?: number;
    onProgress?: (p: E2eEmailBackupProgress) => void;
  },
): Promise<
  | { ok: true; runId: string; emailCount: number; sizeMb: number; s3Path: string }
  | { ok: false; error: string; runId?: string }
> {
  if (!isS3Configured()) {
    return {
      ok: false,
      error: "E2E Chennai storage not configured — set E2E_ENDPOINT, E2E_ACCESS_KEY, and E2E_SECRET_KEY on the host.",
    };
  }

  const email = opts.email.toLowerCase();
  const orgId = await resolveArchiveCompanyId(supabase, opts.companyId, email);
  const maxMessages = Math.min(MAX_CAP, Math.max(1, opts.maxMessages ?? DEFAULT_MAX));
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
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: maxMessages,
    });
    const messages = list.data.messages || [];
    const total = messages.length;

    let uploaded = 0;
    let bytes = 0;

    for (let i = 0; i < messages.length; i++) {
      const id = messages[i].id;
      if (!id) continue;

      const full = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "raw",
      });

      const rawB64 = full.data.raw;
      if (!rawB64) continue;

      const rawEmail = Buffer.from(rawB64, "base64url");

      emit({
        phase: i === 0 ? "fetching" : "uploading",
        message:
          i < 3
            ? `Fetching ${total} emails…`
            : `Archiving to ${bucket}/${prefix} (${uploaded + 1}/${total})`,
        fetched: i + 1,
        uploaded,
        total,
      });

      const archived = await archiveGmailEml({
        orgId,
        messageId: id,
        body: rawEmail,
        supabase,
      });
      if (!archived.ok) throw new Error(archived.error);

      uploaded += 1;
      bytes += rawEmail.length;

      await patchRun(supabase, runId, {
        progress: total > 0 ? Math.round((uploaded / total) * 100) : 0,
        email_count: uploaded,
        size_mb: Math.round((bytes / (1024 * 1024)) * 100) / 100,
      });
    }

    const sizeMb = bytes / (1024 * 1024);
    await patchRun(supabase, runId, {
      status: "completed",
      email_count: uploaded,
      size_mb: Math.round(sizeMb * 100) / 100,
      s3_path: prefix,
      progress: 100,
    });

    emit({
      phase: "done",
      message: `Archived ${uploaded} emails on E2E Mumbai (${bucket}). Gmail not modified.`,
      fetched: total,
      uploaded,
      total,
    });

    return { ok: true, runId, emailCount: uploaded, sizeMb, s3Path: prefix };
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Gmail archive failed";
    if (/insufficient.*scope|403|Forbidden/i.test(msg)) {
      msg =
        "Gmail permission missing — reconnect Google and allow Gmail read/modify on the consent screen.";
    }
    await patchRun(supabase, runId, { status: "error", progress: 0 });
    emit({ phase: "error", message: msg });
    return { ok: false, error: msg, runId };
  }
}

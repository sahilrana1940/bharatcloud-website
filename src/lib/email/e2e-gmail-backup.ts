import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { gmailClient } from "@/lib/google/client";
import { getS3Client } from "@/lib/s3/client";
import { isS3Configured } from "@/lib/s3/config";

export const EMAIL_BACKUP_S3_BUCKET =
  process.env.ARCHIVE_S3_BUCKET?.trim() || "bharatcloudfinal2";

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

function yearFromDate(d = new Date()) {
  return d.getUTCFullYear();
}

function emlKey(orgId: string, year: number, messageId: string) {
  return `email-backup/${orgId}/${year}/${messageId}.eml`;
}

function runPrefix(orgId: string, year: number) {
  return `email-backup/${orgId}/${year}/`;
}

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

async function patchRun(
  supabase: SupabaseClient,
  runId: string,
  patch: Record<string, unknown>,
) {
  await supabase.from("email_backup_runs").update(patch).eq("id", runId);
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
    return { ok: false, error: "E2E S3 not configured (E2E_S3_* / WASABI_* env)." };
  }

  const client = getS3Client();
  if (!client) return { ok: false, error: "S3 client unavailable" };

  const email = opts.email.toLowerCase();
  const orgId = await resolveArchiveCompanyId(supabase, opts.companyId, email);
  const maxMessages = Math.min(MAX_CAP, Math.max(1, opts.maxMessages ?? DEFAULT_MAX));
  const year = yearFromDate();
  const prefix = runPrefix(orgId, year);
  const bucket = EMAIL_BACKUP_S3_BUCKET;

  const { data: runRow, error: insertErr } = await supabase
    .from("email_backup_runs")
    .insert({
      org_id: orgId,
      user_email: email,
      s3_bucket: bucket,
      s3_path: prefix,
      status: "running",
      progress: `Fetching up to ${maxMessages} emails…`,
    })
    .select("id")
    .single();

  if (insertErr || !runRow?.id) {
    return {
      ok: false,
      error: insertErr?.message || "Could not create backup run (apply migration 027).",
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
      progress: "Connect Gmail first (Settings → Google).",
    });
    return { ok: false, error: "Connect Gmail with mail access first.", runId };
  }

  const gmail = gmailClient(accessToken);
  if (!gmail) {
    await patchRun(supabase, runId, { status: "error", progress: "Gmail client unavailable" });
    return { ok: false, error: "Gmail client unavailable", runId };
  }

  emit({ phase: "fetching", message: `Fetching up to ${maxMessages} emails…`, total: maxMessages });
  await patchRun(supabase, runId, { progress: `Fetching up to ${maxMessages} emails…` });

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
      const key = emlKey(orgId, year, id);

      emit({
        phase: i === 0 ? "fetching" : "uploading",
        message:
          i < 3
            ? `Fetching ${total} emails…`
            : `Uploading to ${bucket}/${prefix} (${uploaded + 1}/${total})`,
        fetched: i + 1,
        uploaded,
        total,
      });

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: rawEmail,
          ContentType: "message/rfc822",
          StorageClass: "STANDARD",
        }),
      );

      uploaded += 1;
      bytes += rawEmail.length;

      await patchRun(supabase, runId, {
        progress: `Uploading ${uploaded}/${total} → ${bucket}/${prefix}`,
        email_count: uploaded,
        size_mb: bytes / (1024 * 1024),
      });
    }

    const sizeMb = bytes / (1024 * 1024);
    await patchRun(supabase, runId, {
      status: "completed",
      email_count: uploaded,
      size_mb: sizeMb,
      s3_path: prefix,
      progress: `Done — ${uploaded} emails in ${bucket}`,
    });

    emit({
      phase: "done",
      message: `Backed up ${uploaded} emails to E2E Mumbai (${bucket}).`,
      fetched: total,
      uploaded,
      total,
    });

    return { ok: true, runId, emailCount: uploaded, sizeMb, s3Path: prefix };
  } catch (e) {
    let msg = e instanceof Error ? e.message : "Gmail backup failed";
    if (/insufficient.*scope|403|Forbidden/i.test(msg)) {
      msg =
        "Gmail permission missing — reconnect Google and allow Gmail read/modify on the consent screen.";
    }
    await patchRun(supabase, runId, { status: "error", progress: msg.slice(0, 240) });
    emit({ phase: "error", message: msg });
    return { ok: false, error: msg, runId };
  }
}

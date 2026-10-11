import type { SupabaseClient } from "@supabase/supabase-js";

import { compressForArchive } from "@/lib/backup/compress-media";
import { driveClient } from "@/lib/google/client";
import { archiveObjectKey, uploadToArchive } from "@/lib/s3/archive";

const FILES_PER_TICK = 8;

export async function processBackupJobChunk(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ done: boolean; filesDone: number; error?: string }> {
  const { data: job } = await supabase
    .from("company_backup_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return { done: true, filesDone: 0, error: "Job not found" };
  if (job.status === "completed" || job.status === "failed") {
    return { done: true, filesDone: job.files_done as number };
  }

  const companyId = job.company_id as string;
  const ownerEmail = job.owner_email as string;

  const { data: tok } = await supabase
    .from("google_oauth_tokens")
    .select("access_token")
    .eq("company_id", companyId)
    .eq("email", ownerEmail)
    .maybeSingle();

  if (!tok?.access_token) {
    await supabase
      .from("company_backup_jobs")
      .update({ status: "failed", error_message: "Google token missing", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    await supabase
      .from("company_users")
      .update({ drive_sync_status: "error" })
      .eq("company_id", companyId)
      .eq("email", ownerEmail);
    return { done: true, filesDone: 0, error: "Google token missing" };
  }

  const drive = driveClient(tok.access_token);
  if (!drive) {
    return { done: true, filesDone: 0, error: "Drive client unavailable" };
  }

  await supabase
    .from("company_backup_jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", jobId);
  await supabase
    .from("company_users")
    .update({ drive_sync_status: "backing up" })
    .eq("company_id", companyId)
    .eq("email", ownerEmail);

  const list = await drive.files.list({
    pageSize: FILES_PER_TICK,
    pageToken: (job.drive_page_token as string) || undefined,
    fields: "nextPageToken, files(id,name,mimeType,size)",
    q: "trashed=false",
  });

  const files = list.data.files || [];
  let bytesOriginal = Number(job.bytes_original || 0);
  let bytesCompressed = Number(job.bytes_compressed || 0);
  let filesDone = Number(job.files_done || 0);

  for (const f of files) {
    if (!f.id || !f.name) continue;
    const originalSize = Number(f.size || 0);

    const { data: existing } = await supabase
      .from("company_archive_files")
      .select("id")
      .eq("company_id", companyId)
      .eq("drive_file_id", f.id)
      .maybeSingle();
    if (existing) {
      filesDone += 1;
      continue;
    }

    if (f.mimeType?.startsWith("application/vnd.google-apps")) {
      await supabase.from("company_archive_files").insert({
        company_id: companyId,
        job_id: jobId,
        drive_file_id: f.id,
        file_name: f.name,
        mime_type: f.mimeType,
        original_size: 0,
        compressed_size: 0,
        status: "skipped",
      });
      filesDone += 1;
      continue;
    }

    try {
      const media = await drive.files.get(
        { fileId: f.id, alt: "media" },
        { responseType: "arraybuffer" },
      );
      const raw = Buffer.from(media.data as ArrayBuffer);
      const compressed = await compressForArchive(raw, f.mimeType, f.name);
      const key = archiveObjectKey(companyId, compressed.outName);
      const up = await uploadToArchive(key, compressed.body, compressed.contentType);
      if (!up.ok) throw new Error(up.error);

      await supabase.from("company_archive_files").insert({
        company_id: companyId,
        job_id: jobId,
        drive_file_id: f.id,
        file_name: compressed.outName,
        mime_type: compressed.contentType,
        original_size: originalSize || raw.length,
        compressed_size: compressed.body.length,
        archive_key: key,
        status: "archived",
      });

      bytesOriginal += originalSize || raw.length;
      bytesCompressed += compressed.body.length;
      filesDone += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Archive failed";
      await supabase.from("company_archive_files").insert({
        company_id: companyId,
        job_id: jobId,
        drive_file_id: f.id,
        file_name: f.name,
        mime_type: f.mimeType,
        original_size: originalSize,
        compressed_size: 0,
        status: "failed",
      });
      console.warn("[backup]", f.id, msg);
      filesDone += 1;
    }
  }

  const nextToken = list.data.nextPageToken || null;
  const done = !nextToken;

  await supabase
    .from("company_backup_jobs")
    .update({
      drive_page_token: nextToken,
      files_done: filesDone,
      bytes_original: bytesOriginal,
      bytes_compressed: bytesCompressed,
      status: done ? "completed" : "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const compressedGb = bytesCompressed / 1024 ** 3;
  await supabase
    .from("company_users")
    .update({
      drive_sync_status: done ? "archived" : "backing up",
      drive_used_gb: Math.round(compressedGb * 100) / 100,
    })
    .eq("company_id", companyId)
    .eq("email", ownerEmail);

  return { done, filesDone };
}

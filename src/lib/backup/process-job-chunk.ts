import type { SupabaseClient } from "@supabase/supabase-js";

import { compressForArchive } from "@/lib/backup/compress-media";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { fetchDriveFilesListPage } from "@/lib/google/drive-api";
import { driveClient } from "@/lib/google/client";
import { archiveObjectKey, uploadToArchive } from "@/lib/s3/archive";
import { sha256Buffer } from "@/lib/workspace/company-directory";

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

  const accessToken = await getValidGoogleAccessToken(supabase, companyId, ownerEmail);

  if (!accessToken) {
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

  const drive = driveClient(accessToken);
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

  const list = await fetchDriveFilesListPage(accessToken, {
    pageSize: FILES_PER_TICK,
    pageToken: (job.drive_page_token as string) || undefined,
  });

  const files = list.files || [];
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
      const fileHash = sha256Buffer(compressed.body);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: dup } = await supabase
        .from("company_archive_files")
        .select("id, archive_key, compressed_size")
        .eq("company_id", companyId)
        .eq("file_hash", fileHash)
        .eq("status", "archived")
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();

      let archiveKey = dup?.archive_key as string | undefined;
      let compressedSize = Number(dup?.compressed_size || compressed.body.length);

      if (!archiveKey) {
        archiveKey = archiveObjectKey(companyId, compressed.outName);
        const up = await uploadToArchive(archiveKey, compressed.body, compressed.contentType);
        if (!up.ok) throw new Error(up.error);
        compressedSize = compressed.body.length;
      }

      await supabase.from("company_archive_files").insert({
        company_id: companyId,
        job_id: jobId,
        drive_file_id: f.id,
        file_name: compressed.outName,
        mime_type: compressed.contentType,
        original_size: originalSize || raw.length,
        compressed_size: compressedSize,
        archive_key: archiveKey,
        file_hash: fileHash,
        source_owner_email: ownerEmail,
        status: "archived",
      });

      bytesOriginal += originalSize || raw.length;
      bytesCompressed += compressedSize;
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

  const nextToken = list.nextPageToken || null;
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

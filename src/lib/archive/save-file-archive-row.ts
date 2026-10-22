import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type FileArchiveRow = {
  org_id: string;
  user_email?: string;
  file_name: string;
  s3_bucket?: string;
  s3_key: string;
  storage_class?: string;
  source?: string;
  size_mb?: number;
  size_bytes?: number;
  is_from_start?: boolean;
};

const droppedColumns = new Set<string>();

export async function insertFileArchiveRow(
  _supabase: SupabaseClient | null | undefined,
  row: FileArchiveRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const message = "SUPABASE_SERVICE_ROLE_KEY is not set";
    console.error(message);
    return { ok: false, error: message };
  }
  if (row.source === "gmail" && !row.user_email) {
    const message = "file_archives.user_email is required";
    console.error(message);
    return { ok: false, error: message };
  }

  if (row.source === "gmail") {
    const { error } = await admin.from("file_archives").insert({
      user_email: row.user_email,
      file_name: row.file_name,
      e2e_path: row.s3_key,
      size_bytes: row.size_bytes ?? 0,
      class: "GLACIER",
      source: "gmail",
    });
    if (error) {
      console.error(error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const sizeMb = row.size_mb ?? 0;
  const sizeBytes = row.size_bytes ?? Math.max(0, Math.round(sizeMb * 1024 * 1024));
  const storageClass = row.storage_class || "GLACIER";
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    ...(row.user_email ? { user_email: row.user_email } : {}),
    file_name: row.file_name,
    s3_key: row.s3_key,
    e2e_path: row.s3_key,
    size_bytes: sizeBytes,
    size: String(sizeBytes),
    storage_class: storageClass,
    class: storageClass,
    source: row.source || "gmail",
    created_at: now,
    archived_at: now,
  };
  for (const column of droppedColumns) delete payload[column];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error } = await admin.from("file_archives").insert(payload);
    if (!error) return { ok: true };
    console.error(error.message);
    const missing = error.message.match(/Could not find the '([^']+)' column/i)?.[1];
    if (!missing || !(missing in payload)) return { ok: false, error: error.message };
    droppedColumns.add(missing);
    delete payload[missing];
  }
  return { ok: false, error: "file_archives insert failed" };
}

export async function logArchiveRestore(
  supabase: SupabaseClient,
  opts: {
    org_id: string;
    file_archive_id?: string | null;
    s3_key: string;
    restored_by: string;
  },
): Promise<void> {
  const admin = getSupabaseAdmin() || supabase;
  const { error } = await admin.from("archive_restore_logs").insert({
    org_id: opts.org_id,
    file_archive_id: opts.file_archive_id || null,
    s3_key: opts.s3_key,
    restored_by: opts.restored_by,
  });
  if (error) {
    console.log(
      "[archive_restore_logs] insert error",
      JSON.stringify({ message: error.message, code: error.code, details: error.details }),
    );
  }
}

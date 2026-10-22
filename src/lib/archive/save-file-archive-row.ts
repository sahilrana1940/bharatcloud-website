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
  is_from_start?: boolean;
};

const droppedColumns = new Set<string>();

export async function insertFileArchiveRow(
  _supabase: SupabaseClient | null | undefined,
  row: FileArchiveRow,
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log(
      "[file_archives] insert error",
      JSON.stringify({ message: "SUPABASE_SERVICE_ROLE_KEY is not set" }),
    );
    return;
  }

  const sizeMb = row.size_mb ?? 0;
  const sizeBytes = Math.round(sizeMb * 1024 * 1024);
  const storageClass = row.storage_class || "GLACIER";
  const payload: Record<string, unknown> = {
    org_id: row.org_id,
    user_email: row.user_email || null,
    file_name: row.file_name,
    s3_bucket: row.s3_bucket || "bharatcloudfinal2",
    s3_key: row.s3_key,
    e2e_path: row.s3_key,
    storage_class: storageClass,
    class: storageClass,
    source: row.source || "drive",
    size_mb: sizeMb,
    size: sizeMb,
    size_bytes: sizeBytes,
    is_from_start: row.is_from_start ?? true,
  };
  if (!payload.user_email) delete payload.user_email;
  for (const column of droppedColumns) delete payload[column];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error } = await admin.from("file_archives").insert(payload);
    if (!error) return;
    console.log(
      "[file_archives] insert error",
      JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
    );
    const missing = error.message.match(/Could not find the '([^']+)' column/i)?.[1];
    if (!missing || !(missing in payload)) return;
    droppedColumns.add(missing);
    delete payload[missing];
  }
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

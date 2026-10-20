import type { SupabaseClient } from "@supabase/supabase-js";

export type FileArchiveRow = {
  org_id: string;
  file_name: string;
  s3_bucket?: string;
  s3_key: string;
  storage_class?: string;
  source?: string;
  size_mb?: number;
  is_from_start?: boolean;
};

export async function insertFileArchiveRow(
  supabase: SupabaseClient,
  row: FileArchiveRow,
): Promise<void> {
  const payload = {
    org_id: row.org_id,
    file_name: row.file_name,
    s3_bucket: row.s3_bucket || "bharatcloudfinal2",
    s3_key: row.s3_key,
    storage_class: row.storage_class || "GLACIER",
    source: row.source || "drive",
    size_mb: row.size_mb ?? 0,
    is_from_start: row.is_from_start ?? true,
  };

  const { error } = await supabase.from("file_archives").insert(payload);
  if (error && !/does not exist|schema cache/i.test(error.message)) {
    console.warn("[file_archives]", error.message);
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
  const { error } = await supabase.from("archive_restore_logs").insert({
    org_id: opts.org_id,
    file_archive_id: opts.file_archive_id || null,
    s3_key: opts.s3_key,
    restored_by: opts.restored_by,
  });
  if (error && !/does not exist|schema cache/i.test(error.message)) {
    console.warn("[archive_restore_logs]", error.message);
  }
}

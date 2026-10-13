import type { SupabaseClient } from "@supabase/supabase-js";

export type ArchiveEmailFileRow = {
  company_id: string;
  uploaded_by: string;
  owner_email: string;
  type: "email";
  file_name: string;
  size: number;
  storage_path: string;
  is_central?: boolean;
  gmail_id?: string;
  subject?: string;
  from_email?: string;
  message_date?: string | null;
  metadata?: Record<string, unknown>;
};

function isMissingColumnError(message: string): boolean {
  return /schema cache|could not find the .* column|column.*does not exist/i.test(
    message,
  );
}

function stripOptionalColumns(row: ArchiveEmailFileRow): ArchiveEmailFileRow {
  const {
    is_central: _c,
    metadata: _m,
    message_date: _d,
    from_email: _f,
    subject: _s,
    gmail_id: _g,
    owner_email: _o,
    uploaded_by: _u,
    ...rest
  } = row;
  return rest as ArchiveEmailFileRow;
}

function minimalColumns(row: ArchiveEmailFileRow): ArchiveEmailFileRow {
  return {
    company_id: row.company_id,
    uploaded_by: row.uploaded_by || row.owner_email,
    owner_email: row.owner_email,
    type: "email",
    file_name: row.file_name,
    size: row.size,
    storage_path: row.storage_path,
  };
}

/** Insert/update archive_files — tolerates older/partial tables (missing is_central, etc.). */
export async function upsertArchiveEmailFileRow(
  supabase: SupabaseClient,
  companyId: string,
  gmailId: string,
  row: ArchiveEmailFileRow,
): Promise<{ ok: boolean; warning?: string }> {
  const withoutCentral: ArchiveEmailFileRow = { ...row };
  delete withoutCentral.is_central;
  delete withoutCentral.metadata;

  const attempts: ArchiveEmailFileRow[] = [row, withoutCentral, minimalColumns(row)];

  let existingId: string | null = null;
  const byGmail = await supabase
    .from("archive_files")
    .select("id")
    .eq("company_id", companyId)
    .eq("gmail_id", gmailId)
    .maybeSingle();
  if (!byGmail.error && byGmail.data?.id) {
    existingId = byGmail.data.id as string;
  } else {
    const byPath = await supabase
      .from("archive_files")
      .select("id")
      .eq("company_id", companyId)
      .eq("storage_path", row.storage_path)
      .maybeSingle();
    if (!byPath.error && byPath.data?.id) {
      existingId = byPath.data.id as string;
    }
  }

  let lastMsg = "";
  for (const attempt of attempts) {
    const payload = Object.fromEntries(
      Object.entries(attempt).filter(([, v]) => v !== undefined),
    );

    const { error } = existingId
      ? await supabase.from("archive_files").update(payload).eq("id", existingId)
      : await supabase.from("archive_files").insert(payload);

    if (!error) return { ok: true };
    lastMsg = error.message;
    if (!isMissingColumnError(error.message)) break;
  }

  return {
    ok: false,
    warning: lastMsg
      ? `archive_files index skipped (${lastMsg}). Mail still saved via email_backups.`
      : "archive_files index skipped.",
  };
}

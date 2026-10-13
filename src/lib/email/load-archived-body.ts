import type { SupabaseClient } from "@supabase/supabase-js";

import { EMAIL_ARCHIVE_BUCKET } from "@/lib/archive/run-email-archive";

export type ArchivedEmailRow = {
  id: string;
  company_id: string;
  owner_email: string;
  subject: string | null;
  from_email: string | null;
  date: string | null;
  body_text: string;
};

export async function loadArchivedEmailForForward(
  supabase: SupabaseClient,
  emailId: string,
  companyId: string,
): Promise<ArchivedEmailRow | null> {
  const { data: backupRow } = await supabase
    .from("email_backups")
    .select("id, company_id, owner_email, subject, from_email, date, body_text")
    .eq("id", emailId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (backupRow) {
    return {
      id: backupRow.id as string,
      company_id: backupRow.company_id as string,
      owner_email: String(backupRow.owner_email || ""),
      subject: (backupRow.subject as string) || null,
      from_email: (backupRow.from_email as string) || null,
      date: (backupRow.date as string) || null,
      body_text: String(backupRow.body_text || backupRow.subject || ""),
    };
  }

  const { data: archiveRow } = await supabase
    .from("archive_files")
    .select(
      "id, company_id, owner_email, subject, from_email, message_date, file_name, storage_path, metadata",
    )
    .eq("id", emailId)
    .eq("company_id", companyId)
    .eq("type", "email")
    .maybeSingle();

  if (!archiveRow) return null;

  let body = String(archiveRow.subject || archiveRow.file_name || "");
  const meta = archiveRow.metadata as { snippet?: string; body_text?: string } | null;
  if (meta?.body_text) body = meta.body_text;
  else if (meta?.snippet) body = meta.snippet;

  const path = archiveRow.storage_path as string | null;
  if (path) {
    const { data: blob } = await supabase.storage.from(EMAIL_ARCHIVE_BUCKET).download(path);
    if (blob) {
      try {
        const raw = await blob.text();
        const parsed = JSON.parse(raw) as { snippet?: string };
        if (parsed.snippet) body = parsed.snippet;
      } catch {
        /* keep subject */
      }
    }
  }

  return {
    id: archiveRow.id as string,
    company_id: archiveRow.company_id as string,
    owner_email: String(archiveRow.owner_email || ""),
    subject: (archiveRow.subject as string) || (archiveRow.file_name as string),
    from_email: (archiveRow.from_email as string) || null,
    date: (archiveRow.message_date as string) || null,
    body_text: body,
  };
}

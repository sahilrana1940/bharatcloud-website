import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailBackupRow = {
  company_id: string;
  company_domain?: string;
  owner_email: string;
  gmail_id: string;
  thread_id?: string | null;
  subject?: string | null;
  from_email?: string | null;
  to_email?: string | null;
  date?: string | null;
  body_text?: string | null;
  has_attachment?: boolean;
  folder?: string | null;
  s3_path?: string | null;
};

function isMissingColumnError(message: string): boolean {
  return /schema cache|could not find the .* column|column.*does not exist/i.test(
    message,
  );
}

const CONFLICT_KEYS = ["gmail_id", "company_id,gmail_id"] as const;

/** Upsert email_backups — works on partial schemas (missing folder, to_email, etc.). */
export async function upsertEmailBackupRow(
  supabase: SupabaseClient,
  row: EmailBackupRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const attempts: EmailBackupRow[] = [
    row,
    { ...row, folder: undefined, thread_id: undefined, to_email: undefined },
    {
      company_id: row.company_id,
      owner_email: row.owner_email,
      gmail_id: row.gmail_id,
      subject: row.subject,
      from_email: row.from_email,
      date: row.date,
      body_text: row.body_text,
      s3_path: row.s3_path,
      has_attachment: row.has_attachment ?? false,
    },
    {
      company_id: row.company_id,
      owner_email: row.owner_email,
      gmail_id: row.gmail_id,
      subject: row.subject,
      from_email: row.from_email,
      date: row.date,
      body_text: row.body_text,
      has_attachment: row.has_attachment ?? false,
    },
  ];

  let lastMsg = "";
  for (const attempt of attempts) {
    const payload = Object.fromEntries(
      Object.entries(attempt).filter(([, v]) => v !== undefined),
    );

    for (const onConflict of CONFLICT_KEYS) {
      const { error } = await supabase.from("email_backups").upsert(payload, {
        onConflict,
      });
      if (!error) return { ok: true };
      lastMsg = error.message;
      if (!/on conflict|constraint|no unique|42P10/i.test(error.message)) break;
    }

    if (!isMissingColumnError(lastMsg)) break;
  }

  return { ok: false, error: lastMsg || "email_backups upsert failed" };
}

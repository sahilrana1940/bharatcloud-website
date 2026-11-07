import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Publishable project credentials. Env overrides these when set. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sefrwxkzcomsfyjjcatx.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_HrKptuMK3nk1HNIA2GPWsQ_tZH01eV_";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type EmailBackupInsert = {
  user_email: string;
  gmail_id: string;
  subject: string;
  backup_status: string;
  backup_url: string;
  company_id?: string;
  owner_email?: string;
};

/** One row per fetched Gmail message. A repeat of the same gmail_id is not a failure. */
export async function insertEmailBackup(row: EmailBackupInsert): Promise<void> {
  const payload = {
    user_email: row.user_email,
    owner_email: row.owner_email || row.user_email,
    gmail_id: row.gmail_id,
    subject: row.subject,
    backup_status: row.backup_status,
    backup_url: row.backup_url,
    ...(row.company_id ? { company_id: row.company_id } : {}),
  };

  const envUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const admin =
    !envUrl || envUrl === SUPABASE_URL.replace(/\/$/, "") ? getSupabaseAdmin() : null;
  const clients = [supabase, admin].filter(
    (client): client is NonNullable<typeof client> => Boolean(client),
  );
  let lastMessage = "email_backups insert failed";
  for (const client of clients) {
    const { error } = await client.from("email_backups").insert(payload);
    if (!error) return;
    if (/duplicate key|unique constraint|23505/i.test(error.message)) return;
    lastMessage = error.message;
    if (!/row-level security|permission denied|42501|401|JWT|invalid api key/i.test(error.message)) break;
  }
  throw new Error(`email_backups: ${lastMessage}`);
}

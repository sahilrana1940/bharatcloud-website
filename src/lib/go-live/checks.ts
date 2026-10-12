import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchGoogleTokenRow,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";

export type GoLiveCheckRow = {
  email: string;
  login: boolean;
  drive: boolean;
  backup: boolean;
};

async function hasBackupForUser(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<boolean> {
  const normalized = email.toLowerCase();

  const { count: archiveCount } = await supabase
    .from("company_archive_files")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "archived")
    .eq("source_owner_email", normalized);

  if ((archiveCount || 0) > 0) return true;

  const { count: archiveAny } = await supabase
    .from("company_archive_files")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "archived");

  if (archiveAny && archiveAny > 0) {
    const { data: jobs } = await supabase
      .from("company_backup_jobs")
      .select("owner_email, files_done")
      .eq("company_id", companyId)
      .eq("owner_email", normalized)
      .gt("files_done", 0)
      .limit(1);
    if (jobs?.length) return true;
  }

  const { count: driveBacked } = await supabase
    .from("drive_files")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("owner_email", normalized)
    .eq("backup_status", "backedup");

  if ((driveBacked || 0) > 0) return true;

  const { count: vaultCount } = await supabase
    .from("personal_vault")
    .select("id", { count: "exact", head: true })
    .eq("user_email", normalized)
    .eq("is_deleted", false);

  return (vaultCount || 0) > 0;
}

export async function evaluateGoLiveChecks(
  supabase: SupabaseClient,
  companyId: string,
  emails: string[],
): Promise<GoLiveCheckRow[]> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@")))];

  const rows: GoLiveCheckRow[] = [];

  for (const email of unique) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_login_at")
      .eq("email", email)
      .maybeSingle();

    let login = Boolean(profile?.last_login_at);

    if (!login) {
      const { data: cu } = await supabase
        .from("company_users")
        .select("email")
        .eq("company_id", companyId)
        .eq("email", email)
        .maybeSingle();
      const tokenRow = await fetchGoogleTokenRow(supabase, companyId, email);
      if (cu && isGoogleTokenRowConnected(tokenRow)) {
        login = true;
        await supabase.from("profiles").upsert(
          {
            email,
            company_id: companyId,
            last_login_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
      }
    }

    const tokenRow = await fetchGoogleTokenRow(supabase, companyId, email);
    const drive = isGoogleTokenRowConnected(tokenRow);

    const backup = await hasBackupForUser(supabase, companyId, email);

    rows.push({ email, login, drive, backup });
  }

  return rows;
}

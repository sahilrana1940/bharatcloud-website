import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";

/** Use OAuth token row company when cookie company_id does not match stored tokens. */
export async function resolveArchiveCompanyId(
  supabase: SupabaseClient,
  cookieCompanyId: string,
  email: string,
): Promise<string> {
  const row = await fetchGoogleTokenRowForWorkspace(
    supabase,
    cookieCompanyId,
    email.toLowerCase(),
  );
  if (row?.company_id && isGoogleTokenRowConnected(row)) {
    return row.company_id;
  }
  return cookieCompanyId;
}

export async function ensureCompanyUserForArchive(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
) {
  const normalized = email.toLowerCase();
  await supabase.from("company_users").upsert(
    {
      company_id: companyId,
      email: normalized,
      role: "member",
      saas_role: "employee",
      is_company_owner: false,
      is_backup_enabled: true,
    },
    { onConflict: "company_id,email" },
  );
}

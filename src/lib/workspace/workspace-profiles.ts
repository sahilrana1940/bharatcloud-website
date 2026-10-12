import type { SupabaseClient } from "@supabase/supabase-js";

/** Avoid Supabase Auth `public.profiles` (id-based, no email column). */
export const WORKSPACE_PROFILES_TABLE = "workspace_profiles";
export const WORKSPACE_PROFILE_INVITES_TABLE = "workspace_profile_invites";

export async function upsertProfileInvite(
  supabase: SupabaseClient,
  opts: { companyId: string; email: string; invitedBy?: string },
) {
  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) return;

  await supabase.from(WORKSPACE_PROFILE_INVITES_TABLE).upsert(
    {
      company_id: opts.companyId,
      email,
      invited_by: opts.invitedBy?.toLowerCase() || null,
    },
    { onConflict: "company_id,email" },
  );

  await supabase.from(WORKSPACE_PROFILES_TABLE).upsert(
    {
      email,
      company_id: opts.companyId,
    },
    { onConflict: "email" },
  );
}

export async function touchProfileLogin(
  supabase: SupabaseClient,
  email: string,
  companyId: string,
) {
  const normalized = email.trim().toLowerCase();
  await supabase.from(WORKSPACE_PROFILES_TABLE).upsert(
    {
      email: normalized,
      company_id: companyId,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
}

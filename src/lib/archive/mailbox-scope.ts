import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type MailboxScope = {
  companyId: string;
  email: string;
  userId: string | null;
};

export async function getCompanyUserId(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<string | null> {
  const db = getSupabaseAdmin() || supabase;
  const { data, error } = await db
    .from("company_users")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error(error.message);
    return null;
  }
  return (data?.id as string) || null;
}

/** Tenant + mailbox identity for Gmail archive (never cross-mailbox). */
export async function resolveMailboxScope(
  supabase: SupabaseClient,
  cookieCompanyId: string,
  email: string,
): Promise<MailboxScope> {
  const normalized = email.toLowerCase();
  const companyId = await resolveArchiveCompanyId(supabase, cookieCompanyId, normalized);
  const userId = await getCompanyUserId(supabase, companyId, normalized);
  return { companyId, email: normalized, userId };
}

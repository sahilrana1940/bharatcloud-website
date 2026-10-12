import type { SupabaseClient } from "@supabase/supabase-js";

import type { SaasRole } from "@/lib/workspace/session";

/** True when this email is the tenant owner (companies.admin_email or organizations.owner_email). */
export async function isTenantOwnerEmail(
  supabase: SupabaseClient,
  email: string,
  companyId?: string | null,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_email", normalized)
    .maybeSingle();
  if (org) return true;

  if (companyId) {
    const { data: co } = await supabase
      .from("companies")
      .select("admin_email")
      .eq("id", companyId)
      .maybeSingle();
    if (co?.admin_email?.toLowerCase() === normalized) return true;
  }

  const { data: byAdmin } = await supabase
    .from("companies")
    .select("id")
    .eq("admin_email", normalized)
    .maybeSingle();
  return Boolean(byAdmin?.id);
}

export function ownerRoleInfo(email: string, companyDomain: string | null): {
  role: SaasRole;
  is_company_owner: boolean;
  company_domain: string | null;
  email: string;
} {
  return {
    role: "company_owner",
    is_company_owner: true,
    company_domain: companyDomain,
    email: email.toLowerCase(),
  };
}

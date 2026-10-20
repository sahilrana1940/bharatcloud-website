import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardRole = "admin" | "employee";

export function dashboardPathForRole(role: DashboardRole) {
  return role === "admin" ? "/dashboard/admin" : "/dashboard/employee";
}

/** Org owner, organization member, or a brand-new company login. */
export async function resolveDashboardRole(
  supabase: SupabaseClient | null,
  email: string,
): Promise<{ role: DashboardRole; target: string }> {
  const normalized = email.trim().toLowerCase();
  if (!supabase) {
    return { role: "admin", target: dashboardPathForRole("admin") };
  }

  const { data: orgOwner } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_email", normalized)
    .maybeSingle();

  if (orgOwner?.id) {
    return { role: "admin", target: dashboardPathForRole("admin") };
  }

  const member = await readMember(supabase, normalized);
  if (member) {
    const role: DashboardRole = member.role === "admin" ? "admin" : "employee";
    return { role, target: dashboardPathForRole(role) };
  }

  return { role: "admin", target: dashboardPathForRole("admin") };
}

async function readMember(supabase: SupabaseClient, email: string) {
  const byNew = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("email", email)
    .maybeSingle();
  if (!byNew.error && byNew.data) {
    return { orgId: String(byNew.data.org_id || ""), role: String(byNew.data.role || "employee") };
  }

  const byLegacy = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_email", email)
    .maybeSingle();
  if (!byLegacy.error && byLegacy.data) {
    return { orgId: String(byLegacy.data.org_id || ""), role: String(byLegacy.data.role || "member") };
  }

  const byCompany = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("email", email)
    .maybeSingle();
  if (!byCompany.error && byCompany.data) {
    const role = String(byCompany.data.role || "member") === "admin" ? "admin" : "employee";
    return { orgId: String(byCompany.data.company_id || ""), role };
  }

  return null;
}

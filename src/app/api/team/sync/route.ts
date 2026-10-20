import { NextResponse } from "next/server";

import { loadTenantCompany } from "@/lib/tenant";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { syncCompanyDirectory } from "@/lib/workspace/company-directory";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Owner: sync directory + handoff staff into company_users (Add User). */
export async function POST() {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const company = await loadTenantCompany(session.companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { synced } = await syncCompanyDirectory(session.companyId, company.domain);

  await supabase.from("company_users").upsert(
    {
      company_id: session.companyId,
      email: session.email.toLowerCase(),
      role: "admin",
      saas_role: "company_owner",
      is_company_owner: true,
      is_backup_enabled: true,
      display_name: session.email.split("@")[0],
    },
    { onConflict: "company_id,email" },
  );

  const { data: users } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  return NextResponse.json({
    users: users || [],
    synced: synced + 1,
    vault: "E2E Mumbai — bharatcloudfinal2",
  });
}

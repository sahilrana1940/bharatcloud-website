import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { isPlatformSuperAdminEmail } from "@/lib/roles/platform-roles";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!role.email || !isPlatformSuperAdminEmail(role.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ tenants: [] });
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: companies } = await supabase.from("companies").select("*");
  const companyByDomain = new Map(
    (companies || []).map((c) => [String(c.domain).toLowerCase(), c]),
  );

  const tenants = [];
  for (const w of workspaces || []) {
    const domain = String(w.domain);
    const co = companyByDomain.get(domain.toLowerCase());
    let storage_gb = 0;
    let employees = 0;
    if (co?.id) {
      const { data: users } = await supabase
        .from("company_users")
        .select("drive_used_gb")
        .eq("company_id", co.id);
      storage_gb = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);
      employees = users?.length || 0;
    }
    tenants.push({
      id: w.id,
      domain,
      owner_email: w.owner_email,
      plan_paid: w.plan_paid,
      paytm_txn: w.paytm_txn,
      storage_gb,
      employees,
      status: co?.subscription_status || (w.plan_paid ? "active" : "trial"),
    });
  }

  if (!tenants.length && companies?.length) {
    for (const c of companies) {
      const { count } = await supabase
        .from("company_users")
        .select("*", { count: "exact", head: true })
        .eq("company_id", c.id);
      const { data: users } = await supabase
        .from("company_users")
        .select("drive_used_gb")
        .eq("company_id", c.id);
      const storage_gb = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);
      tenants.push({
        id: c.id,
        domain: c.domain,
        owner_email: c.admin_email,
        plan_paid: c.subscription_status === "active",
        paytm_txn: null,
        storage_gb,
        employees: count || 0,
        status: c.subscription_status || "trial",
      });
    }
  }

  return NextResponse.json({ tenants });
}

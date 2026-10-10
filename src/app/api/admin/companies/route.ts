import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      companies: [
        {
          domain: "rjadam.com",
          owner_email: "admin@rjadam.com",
          employees: 5,
          storage_gb: 44.5,
          status: "active",
        },
      ],
    });
  }

  const { data: companies } = await supabase.from("companies").select("*");
  const rows = [];
  for (const c of companies || []) {
    const { count } = await supabase
      .from("company_users")
      .select("*", { count: "exact", head: true })
      .eq("company_id", c.id);
    const { data: users } = await supabase
      .from("company_users")
      .select("drive_used_gb")
      .eq("company_id", c.id);
    const storage = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);
    rows.push({
      id: c.id,
      domain: c.domain,
      owner_email: c.admin_email,
      employees: count || 0,
      storage_gb: storage,
      status: c.subscription_status || "trial",
    });
  }
  return NextResponse.json({ companies: rows });
}

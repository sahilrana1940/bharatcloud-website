import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { getSessionRole } from "@/lib/auth";
import { demoPaymentsList } from "@/lib/payments/store";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!role || role.role !== "super_admin") {
    if (role?.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const approved = demoPaymentsList().filter((p) => p.status === "approved");
    const revenue = approved.reduce((s, p) => s + p.amount, 0);
    return NextResponse.json({
      companies: 1,
      revenue,
      storageGb: 44.5,
      employees: DEMO_USERS.length,
    });
  }

  const { count: companies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "approved");
  const revenue = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  const { count: employees } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true });

  const { data: usage } = await supabase.from("company_users").select("drive_used_gb");
  const storageGb = (usage || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);

  return NextResponse.json({
    companies: companies || 0,
    revenue,
    storageGb,
    employees: employees || 0,
  });
}

import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/admin/access";
import { monthlyTotalInr, PLATFORM_COST_LINES } from "@/lib/admin/platform-costs";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthlyCosts = monthlyTotalInr();
  const supabase = await getSupabaseOrNull();
  let revenue = 0;
  let pendingCount = 0;
  let approvedCount = 0;

  if (supabase) {
    const { data: approved } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "approved");
    revenue = (approved || []).reduce((s, p) => s + Number(p.amount || 0), 0);

    const { count: pending } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = pending ?? 0;

    const { count: approvedN } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");
    approvedCount = approvedN ?? 0;
  }

  return NextResponse.json({
    revenueInr: revenue,
    monthlyCostsInr: monthlyCosts,
    netInr: revenue - monthlyCosts,
    pendingPayments: pendingCount,
    approvedPayments: approvedCount,
    costLines: PLATFORM_COST_LINES,
  });
}

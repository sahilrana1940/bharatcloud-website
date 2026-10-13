import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/admin/access";
import {
  monthlyLegacyTotalInr,
  monthlyTotalInr,
  PLATFORM_COST_LINES,
} from "@/lib/admin/platform-costs";
import { companyPaymentBalances } from "@/lib/billing/company-balances";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthlyCosts = monthlyTotalInr();
  const monthlyLegacyCosts = monthlyLegacyTotalInr();
  const supabase = await getSupabaseOrNull();
  let revenue = 0;
  let revenueThisMonth = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  let customerPaidTotal = 0;
  let customerDueTotal = 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  if (supabase) {
    const { data: approved } = await supabase
      .from("payments")
      .select("amount, created_at")
      .eq("status", "approved");
    revenue = (approved || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    revenueThisMonth = (approved || [])
      .filter((p) => new Date(p.created_at) >= monthStart)
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const { data: companies } = await supabase.from("companies").select("id, domain, plan_name");
    for (const c of companies || []) {
      const balances = await companyPaymentBalances(
        supabase,
        c.id,
        (c as { plan_name?: string }).plan_name,
        c.domain,
      );
      customerPaidTotal += balances.totalPaid;
      customerDueTotal += balances.dueAmount;
    }

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

  const netInr = revenue - monthlyCosts;
  const netThisMonthInr = revenueThisMonth - monthlyCosts;

  return NextResponse.json({
    revenueInr: revenue,
    revenueThisMonthInr: revenueThisMonth,
    monthlyCostsInr: monthlyCosts,
    monthlyLegacyCostsInr: monthlyLegacyCosts,
    netInr,
    netThisMonthInr,
    pendingPayments: pendingCount,
    approvedPayments: approvedCount,
    customerPaidTotalInr: customerPaidTotal,
    customerDueTotalInr: customerDueTotal,
    costLines: PLATFORM_COST_LINES,
  });
}

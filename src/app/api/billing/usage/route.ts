import { NextResponse } from "next/server";

import {
  loadBillingUsage,
  sumUsageInr,
} from "@/lib/billing/usage";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;
  const planId = tenant?.company.plan_name || "starter";

  const supabase = await getSupabaseOrNull();
  const { rows, capInr, month } = await loadBillingUsage(supabase, companyId, planId);
  const usedInr = sumUsageInr(rows);
  const percent = capInr > 0 ? Math.min(100, Math.round((usedInr / capInr) * 100)) : 0;

  return NextResponse.json({
    month,
    usedInr,
    capInr,
    percent,
    currency: "INR",
    gstIncluded: true,
    rows: rows.map((r) => ({
      id: r.id,
      date: r.usageDate,
      service: r.service,
      units: r.units,
      amount: r.amount,
    })),
  });
}

import { NextResponse } from "next/server";

import { buildInvoiceFromUsage } from "@/lib/billing/invoice";
import { loadBillingUsage } from "@/lib/billing/usage";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;
  const domain = tenant?.company.domain;
  const planId = tenant?.company.plan_name || "starter";

  const supabase = await getSupabaseOrNull();
  const { rows, month } = await loadBillingUsage(supabase, companyId, planId);
  const invoice = buildInvoiceFromUsage(companyId, month, rows, domain);

  return NextResponse.json({ invoice });
}

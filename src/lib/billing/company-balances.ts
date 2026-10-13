import { getBillingPlan } from "@/lib/billing/plans";
import { loadBillingUsage, sumUsageInr } from "@/lib/billing/usage";
import type { SupabaseClient } from "@supabase/supabase-js";

function monthStartIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function companyPaymentBalances(
  supabase: SupabaseClient,
  companyId: string,
  planName?: string | null,
  domain?: string | null,
): Promise<{ totalPaid: number; dueAmount: number }> {
  let payments: { amount: number; status: string; created_at: string }[] | null = null;
  const byId = await supabase
    .from("payments")
    .select("amount, status, created_at")
    .eq("company_id", companyId);
  payments = byId.data;
  if ((!payments || payments.length === 0) && domain) {
    const byDomain = await supabase
      .from("payments")
      .select("amount, status, created_at")
      .eq("company_domain", domain);
    payments = byDomain.data;
  }

  const forCompany = payments || [];

  const approved = forCompany.filter((p) => p.status === "approved");
  const totalPaid = approved.reduce((s, p) => s + Number(p.amount || 0), 0);

  const monthStart = new Date(monthStartIso());
  const paidThisMonth = approved
    .filter((p) => new Date(p.created_at) >= monthStart)
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const plan = getBillingPlan(planName || "starter");
  const cap = plan.id === "starter" ? 1999 : plan.price;
  const { rows } = await loadBillingUsage(supabase, companyId, planName || undefined);
  const used = sumUsageInr(rows);
  const dueFromCap = Math.max(0, cap - paidThisMonth);
  const dueFromUsage = Math.max(0, used - paidThisMonth);
  const dueAmount = Math.max(dueFromCap, dueFromUsage);

  return { totalPaid, dueAmount };
}

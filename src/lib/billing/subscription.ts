import type { SupabaseClient } from "@supabase/supabase-js";

import { isDemoBillingDomain } from "@/lib/billing/demo-domain";
import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";

/** Paid backup gate — uses `companies` + `payments` only (not `organizations`). */
export async function companyHasPaidBackup(
  supabase: SupabaseClient,
  companyId: string,
  companyDomain?: string,
): Promise<boolean> {
  if (await isPaymentBypassEnabled()) return true;
  if (isDemoBillingDomain(companyDomain)) return true;

  if (companyDomain) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("plan, owner_email, name")
      .limit(50);
    const host = companyDomain.trim().toLowerCase();
    const org = (orgs || []).find((row) => {
      const owner = String(row.owner_email || "").toLowerCase();
      const name = String(row.name || "").toLowerCase();
      return owner.endsWith(`@${host}`) || name === host;
    });
    if (String(org?.plan || "").trim()) return true;
  }

  const { data: co } = await supabase
    .from("companies")
    .select("subscription_status, plan_name")
    .eq("id", companyId)
    .maybeSingle();

  if (co?.subscription_status === "active") return true;

  const { data: byId } = await supabase
    .from("payments")
    .select("id")
    .eq("company_id", companyId)
    .in("status", ["approved", "paid", "active"])
    .limit(1);
  if (byId?.length) return true;

  if (companyDomain) {
    const { data: byDomain } = await supabase
      .from("payments")
      .select("id")
      .eq("company_domain", companyDomain)
      .in("status", ["approved", "paid", "active"])
      .limit(1);
    return Boolean(byDomain?.length);
  }

  return false;
}

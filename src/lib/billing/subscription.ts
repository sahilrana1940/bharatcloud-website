import type { SupabaseClient } from "@supabase/supabase-js";

import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";

/** Paid backup gate — uses `companies` + `payments` only (not `organizations`). */
export async function companyHasPaidBackup(
  supabase: SupabaseClient,
  companyId: string,
  companyDomain?: string,
): Promise<boolean> {
  if (await isPaymentBypassEnabled()) return true;

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

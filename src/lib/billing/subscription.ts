import type { SupabaseClient } from "@supabase/supabase-js";

export async function companyHasPaidBackup(
  supabase: SupabaseClient,
  companyId: string,
  companyDomain: string,
): Promise<boolean> {
  const { data: co } = await supabase
    .from("companies")
    .select("subscription_status")
    .eq("id", companyId)
    .maybeSingle();

  if (co?.subscription_status === "active") return true;

  const { data: payments } = await supabase
    .from("payments")
    .select("id")
    .eq("company_domain", companyDomain)
    .in("status", ["approved", "paid", "active"])
    .limit(1);

  return Boolean(payments?.length);
}

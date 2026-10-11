import { emailDomain } from "@/lib/google/client";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function resolveCompanyDomain(companyId: string, fallbackEmail: string) {
  if (companyId === DEMO_COMPANY_ID) {
    return process.env.DEMO_COMPANY_DOMAIN || "demo.example.com";
  }
  const supabase = await getSupabaseOrNull();
  if (!supabase) return emailDomain(fallbackEmail);
  const { data } = await supabase
    .from("companies")
    .select("domain")
    .eq("id", companyId)
    .maybeSingle();
  return data?.domain || emailDomain(fallbackEmail);
}

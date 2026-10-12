import { emailDomain } from "@/lib/google/client";

import { emailMatchesDomain, syncCompanyDirectory } from "@/lib/workspace/company-directory";

import { getSupabaseOrNull } from "./db";

export type CompanyRow = {
  id: string;
  domain: string;
  admin_email: string;
};

export function isCompanyOwnerEmail(email: string, adminEmail: string): boolean {
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}

/** One tenant per email domain — staff @company.domain join the existing row. */
export function canAutoJoinCompany(email: string, company: CompanyRow): boolean {
  const normalized = email.trim().toLowerCase();
  if (isCompanyOwnerEmail(normalized, company.admin_email)) return true;

  return emailMatchesDomain(normalized, company.domain);
}

export async function findCompanyByDomain(domain: string): Promise<CompanyRow | null> {
  const supabase = await getSupabaseOrNull();
  if (!supabase || !domain) return null;

  const { data } = await supabase
    .from("companies")
    .select("id, domain, admin_email")
    .eq("domain", domain.toLowerCase())
    .maybeSingle();

  if (!data?.id) return null;
  return {
    id: data.id as string,
    domain: data.domain as string,
    admin_email: data.admin_email as string,
  };
}

/** Sync directory + @domain team rows (generic; optional handoff profile per domain). */
export async function provisionLinkedStaff(companyId: string, domain: string): Promise<void> {
  await syncCompanyDirectory(companyId, domain);
}

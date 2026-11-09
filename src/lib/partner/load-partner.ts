import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerDashboard = {
  partnerName: string;
  companyName: string;
  totalIds: number;
  paymentStatus: string;
  renewalDate: string | null;
};

type PartnerRow = {
  partner_name: string;
  company_name: string;
  company_id: string | null;
  total_ids: number | null;
  payment_status: string;
  renewal_date: string | null;
};

type CompanyRow = {
  id: string;
  domain: string;
  admin_email: string;
  created_at: string;
  subscription_status?: string | null;
};

function nameFromEmail(email: string) {
  const local = email.split("@")[0] || "Partner";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) return "Partner";
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function dateOnly(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function plusOneYear(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function countCompanyUsers(supabase: SupabaseClient, companyId: string) {
  const { count } = await supabase
    .from("company_users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  return count ?? 0;
}

async function latestPayment(supabase: SupabaseClient, companyId: string, domain: string) {
  const byCompany = await supabase
    .from("payments")
    .select("status, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!byCompany.error && byCompany.data) return byCompany.data;

  const byDomain = await supabase
    .from("payments")
    .select("status, created_at")
    .eq("company_domain", domain)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return byDomain.data;
}

async function loadCompany(supabase: SupabaseClient, email: string): Promise<CompanyRow | null> {
  const withStatus = await supabase
    .from("companies")
    .select("id, domain, admin_email, created_at, subscription_status")
    .ilike("admin_email", email)
    .maybeSingle();
  if (!withStatus.error) return (withStatus.data as CompanyRow | null) ?? null;

  const basic = await supabase
    .from("companies")
    .select("id, domain, admin_email, created_at")
    .ilike("admin_email", email)
    .maybeSingle();
  return (basic.data as CompanyRow | null) ?? null;
}

export async function loadPartnerDashboard(
  supabase: SupabaseClient,
  email: string,
  firebaseUid: string,
): Promise<PartnerDashboard | null> {
  const partnerQuery = await supabase
    .from("partners")
    .select("partner_name, company_name, company_id, total_ids, payment_status, renewal_date")
    .ilike("email", email)
    .maybeSingle();

  const partnerMissing =
    partnerQuery.error?.code === "PGRST205" ||
    partnerQuery.error?.code === "42P01" ||
    /partners/i.test(partnerQuery.error?.message || "");

  const partner = partnerMissing ? null : (partnerQuery.data as PartnerRow | null);
  if (partnerQuery.error && !partnerMissing) {
    throw new Error(partnerQuery.error.message);
  }

  if (partner) {
    void supabase.from("partners").update({ firebase_uid: firebaseUid }).ilike("email", email);
    const totalIds =
      partner.total_ids ??
      (partner.company_id ? await countCompanyUsers(supabase, partner.company_id) : 0);
    return {
      partnerName: partner.partner_name,
      companyName: partner.company_name,
      totalIds,
      paymentStatus: partner.payment_status || "pending",
      renewalDate: dateOnly(partner.renewal_date),
    };
  }

  const [company, org] = await Promise.all([
    loadCompany(supabase, email),
    supabase
      .from("organizations")
      .select("name")
      .ilike("owner_email", email)
      .maybeSingle(),
  ]);

  if (!company && !org.data?.name) return null;

  const totalIds = company ? await countCompanyUsers(supabase, company.id) : 0;
  const payment = company ? await latestPayment(supabase, company.id, company.domain) : null;

  return {
    partnerName: nameFromEmail(email),
    companyName: org.data?.name || company?.domain || "Company",
    totalIds,
    paymentStatus: payment?.status || company?.subscription_status || "pending",
    renewalDate: plusOneYear(payment?.created_at) || plusOneYear(company?.created_at),
  };
}

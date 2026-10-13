import { emailDomain } from "@/lib/google/client";
import {
  isPlatformOperatorEmail,
  PLATFORM_OPERATOR_COMPANY_ID,
} from "@/lib/platform/operator";

import {
  canAutoJoinCompany,
  findCompanyByDomain,
  isCompanyOwnerEmail,
  provisionLinkedStaff,
} from "@/lib/workspace/company-membership";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

async function upsertCompanyUser(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>,
  opts: {
    companyId: string;
    email: string;
    isOwner: boolean;
  },
) {
  await supabase.from("company_users").upsert(
    {
      company_id: opts.companyId,
      email: opts.email,
      role: opts.isOwner ? "admin" : "member",
      saas_role: opts.isOwner ? "company_owner" : "employee",
      is_company_owner: opts.isOwner,
      is_backup_enabled: true,
    },
    { onConflict: "company_id,email" },
  );
}

/**
 * Ensures every login maps to one `companies.id` (single tenant per domain).
 * Staff on the same domain / handoff list auto-link — no second company row.
 */
export async function resolveCompanyIdForEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (isPlatformOperatorEmail(normalized)) {
    return PLATFORM_OPERATOR_COMPANY_ID;
  }
  const supabase = await getSupabaseOrNull();
  if (!supabase) return DEMO_COMPANY_ID;

  const domain = emailDomain(normalized);
  if (!domain) return DEMO_COMPANY_ID;

  const { data: member } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("email", normalized)
    .maybeSingle();
  if (member?.company_id) return member.company_id as string;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, owner_email")
    .eq("owner_email", normalized)
    .maybeSingle();

  const isOrgOwner = org?.owner_email === normalized;

  const existingCo = await findCompanyByDomain(domain);

  if (existingCo && canAutoJoinCompany(normalized, existingCo)) {
    const isOwner = isCompanyOwnerEmail(normalized, existingCo.admin_email) || isOrgOwner;
    await upsertCompanyUser(supabase, {
      companyId: existingCo.id,
      email: normalized,
      isOwner,
    });
    if (isOwner) {
      await provisionLinkedStaff(existingCo.id, existingCo.domain);
    }
    return existingCo.id;
  }

  const { data: byAdmin } = await supabase
    .from("companies")
    .select("id, admin_email, domain")
    .eq("admin_email", normalized)
    .maybeSingle();

  let companyId: string | null = (byAdmin?.id as string) || null;

  if (!companyId && isOrgOwner) {
    const { data: created, error } = await supabase
      .from("companies")
      .insert({
        domain,
        admin_email: normalized,
        plan_name: "starter",
        storage_limit_gb: 100,
      })
      .select("id")
      .single();
    if (error || !created) {
      return DEMO_COMPANY_ID;
    }
    companyId = created.id as string;
    await supabase.from("company_settings").insert({ company_id: companyId });
    await provisionLinkedStaff(companyId, domain);
  }

  if (!companyId) {
    return DEMO_COMPANY_ID;
  }

  const adminEmail =
    (byAdmin?.admin_email as string) || existingCo?.admin_email || normalized;
  const isOwner = isOrgOwner || isCompanyOwnerEmail(normalized, adminEmail);

  await upsertCompanyUser(supabase, {
    companyId,
    email: normalized,
    isOwner,
  });

  if (isOwner) {
    const coDomain = (byAdmin?.domain as string) || domain;
    await provisionLinkedStaff(companyId, coDomain);
  }

  return companyId;
}

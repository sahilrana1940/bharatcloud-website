import { emailDomain } from "@/lib/google/client";
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
 * Ensures every B2B login has a `companies` + `company_users` row (multi-tenant).
 * Returns real `companies.id` for workspace cookies.
 */
export async function resolveCompanyIdForEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
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

  const { data: byAdmin } = await supabase
    .from("companies")
    .select("id, admin_email")
    .eq("admin_email", normalized)
    .maybeSingle();

  const { data: byDomain } = await supabase
    .from("companies")
    .select("id, admin_email")
    .eq("domain", domain)
    .maybeSingle();

  let companyId: string | null =
    (byAdmin?.id as string) || (byDomain?.id as string) || null;

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
    companyId = created.id;
    await supabase.from("company_settings").insert({ company_id: companyId });
  }

  if (!companyId) {
    return DEMO_COMPANY_ID;
  }

  const isOwner =
    isOrgOwner ||
    byAdmin?.id === companyId ||
    byDomain?.admin_email === normalized;

  await upsertCompanyUser(supabase, {
    companyId,
    email: normalized,
    isOwner,
  });

  return companyId;
}

import { emailDomain } from "@/lib/google/client";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Real `companies.id` for workspace cookies (drive, vault, team). */
export async function resolveCompanyIdForEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const supabase = await getSupabaseOrNull();
  if (!supabase) return DEMO_COMPANY_ID;

  const { data: member } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("email", normalized)
    .maybeSingle();
  if (member?.company_id) return member.company_id as string;

  const { data: byAdmin } = await supabase
    .from("companies")
    .select("id")
    .eq("admin_email", normalized)
    .maybeSingle();
  if (byAdmin?.id) return byAdmin.id as string;

  const domain = emailDomain(normalized);
  if (domain) {
    const { data: byDomain } = await supabase
      .from("companies")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();
    if (byDomain?.id) return byDomain.id as string;
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, owner_email")
    .eq("owner_email", normalized)
    .maybeSingle();
  if (org?.owner_email) {
    const orgDomain = emailDomain(org.owner_email);
    if (orgDomain) {
      const { data: linked } = await supabase
        .from("companies")
        .select("id")
        .eq("domain", orgDomain)
        .maybeSingle();
      if (linked?.id) return linked.id as string;
    }
  }

  return DEMO_COMPANY_ID;
}

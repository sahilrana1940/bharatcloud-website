import type { SupabaseClient } from "@supabase/supabase-js";

import { loadTenantCompany } from "@/lib/tenant";

/** Email whose Google token is used for company-wide Drive folder operations (default: admin). */
export async function getCentralDriveOwnerEmail(
  supabase: SupabaseClient,
  companyId: string,
): Promise<string | null> {
  const company = await loadTenantCompany(companyId);
  if (!company) return null;

  const central =
    (company as { central_drive_owner_email?: string }).central_drive_owner_email ||
    company.admin_email;
  return central?.toLowerCase() || null;
}

export function centralDriveFolderName(companyNameOrDomain: string) {
  const label = companyNameOrDomain.replace(/\s+/g, " ").trim() || "Workspace";
  return `BharatCloud - ${label}`;
}

import { getSessionRole } from "@/lib/auth";
import { getUploadContext } from "@/lib/personal/access";
import type { VaultRow } from "@/lib/personal/demo-store";

export async function canAccessVaultFile(
  row: { user_email: string; company_domain: string | null },
  viewerEmail: string,
) {
  const ctx = await getUploadContext();
  const role = await getSessionRole();
  if (row.user_email === viewerEmail.toLowerCase()) return true;
  if (!row.company_domain) return false;
  if (role?.role === "super_admin") return true;
  if (role?.is_company_owner && ctx?.companyDomain === row.company_domain) return true;
  if (ctx?.companyDomain === row.company_domain) return true;
  return false;
}

export function filterVaultForViewer(
  items: VaultRow[],
  email: string,
  companyDomain: string | null,
  isOwner: boolean,
) {
  return items.filter((r) => {
    if (r.is_deleted) return false;
    if (!companyDomain) return r.user_email === email && !r.company_domain;
    if (isOwner) return r.company_domain === companyDomain;
    return r.user_email === email || r.company_domain === companyDomain;
  });
}

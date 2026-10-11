import { getSessionRole } from "@/lib/auth";
import { loadTenantCompany } from "@/lib/tenant";
import { B2C_PERSONAL_COMPANY_ID } from "@/lib/workspace/b2c";
import { getWorkspaceSession } from "@/lib/workspace/session";

export async function getUploadContext() {
  const session = await getWorkspaceSession();
  if (!session) return null;
  const role = await getSessionRole();
  const company = await loadTenantCompany(session.companyId);
  const companyDomain =
    session.companyId === B2C_PERSONAL_COMPANY_ID
      ? null
      : (company?.domain ?? null);

  return {
    email: session.email.toLowerCase(),
    companyDomain,
    session,
    role,
    isB2C: session.companyId === B2C_PERSONAL_COMPANY_ID,
  };
}

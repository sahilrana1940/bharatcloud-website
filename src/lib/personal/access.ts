import { getSessionRole } from "@/lib/auth";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { B2C_PERSONAL_COMPANY_ID } from "@/lib/workspace/b2c";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import { getWorkspaceSession } from "@/lib/workspace/session";

export async function getUploadContext() {
  const session = await getWorkspaceSession();
  if (!session) return null;
  const role = await getSessionRole();
  const domain = await resolveCompanyDomain(session.companyId, session.email);

  let companyDomain: string | null = null;
  if (session.companyId === B2C_PERSONAL_COMPANY_ID) {
    companyDomain = null;
  } else if (session.companyId === DEMO_COMPANY_ID) {
    companyDomain = domain;
  } else {
    companyDomain = domain;
  }

  return {
    email: session.email.toLowerCase(),
    companyDomain,
    session,
    role,
    isB2C: session.companyId === B2C_PERSONAL_COMPANY_ID,
  };
}

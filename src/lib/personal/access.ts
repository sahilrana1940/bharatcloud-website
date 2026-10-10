import { getSessionRole } from "@/lib/auth";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { getWorkspaceSession } from "@/lib/workspace/session";

export async function getUploadContext() {
  const session = await getWorkspaceSession();
  if (!session) return null;
  const role = await getSessionRole();
  const companyDomain = await resolveCompanyDomain(session.companyId, session.email);
  const isB2B = Boolean(companyDomain && session.companyId !== "demo-company-workspace");
  return {
    email: session.email.toLowerCase(),
    companyDomain: isB2B ? companyDomain : null,
    session,
    role,
  };
}

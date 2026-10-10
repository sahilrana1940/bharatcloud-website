import { cookies } from "next/headers";

export const WS_COMPANY_COOKIE = "bc_workspace_company";
export const WS_EMAIL_COOKIE = "bc_workspace_email";
export const WS_ROLE_COOKIE = "bc_workspace_role";
export const WS_SAAS_ROLE_COOKIE = "bc_saas_role";
export const WS_IS_OWNER_COOKIE = "bc_is_company_owner";

export type WorkspaceRole = "admin" | "member";
export type SaasRole = "super_admin" | "company_owner" | "employee";

export async function getWorkspaceSession() {
  const jar = await cookies();
  const companyId = jar.get(WS_COMPANY_COOKIE)?.value ?? null;
  const email = jar.get(WS_EMAIL_COOKIE)?.value ?? null;
  const role = (jar.get(WS_ROLE_COOKIE)?.value ?? "member") as WorkspaceRole;
  if (!companyId || !email) return null;
  const saasRole = (jar.get(WS_SAAS_ROLE_COOKIE)?.value ?? "employee") as SaasRole;
  const isCompanyOwner = jar.get(WS_IS_OWNER_COOKIE)?.value === "1";
  return { companyId, email, role, saasRole, isCompanyOwner };
}

export function workspaceCookieOptions(maxAge = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

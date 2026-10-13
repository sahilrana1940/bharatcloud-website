import { isSuperAdminEmail, listSuperAdminEmails } from "@/lib/brand";

/** Cookie / session marker — not a row in `companies`. Platform console only. */
export const PLATFORM_OPERATOR_ORG_ID = "bharatcloud-platform-operator";

export const PLATFORM_OPERATOR_COMPANY_ID =
  "00000000-0000-0000-0000-000000000001";

export function isPlatformOperatorEmail(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email);
}

export { listSuperAdminEmails };

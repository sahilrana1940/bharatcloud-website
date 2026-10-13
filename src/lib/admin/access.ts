import type { UserRoleInfo } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";

export function isPlatformAdminSession(role: UserRoleInfo | null | undefined): boolean {
  if (!role?.email) return false;
  return role.role === "super_admin" || isSuperAdminEmail(role.email);
}

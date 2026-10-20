/** Platform owner — sees all tenant Admins at /dashboard */
export const PLATFORM_SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export type PlatformRole = "SuperAdmin" | "Admin" | "Employee";

export function listPlatformSuperAdminEmails(): string[] {
  const fromEnv = process.env.PLATFORM_SUPER_ADMIN_EMAILS?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const base = [PLATFORM_SUPER_ADMIN_EMAIL.toLowerCase()];
  return [...new Set([...base, ...(fromEnv || [])])];
}

export function isPlatformSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return listPlatformSuperAdminEmails().includes(email.toLowerCase());
}

export function e2eWorkspacePrefix(domain: string): string {
  const safe = domain.replace(/[^a-z0-9.-]/gi, "").toLowerCase();
  return `workspaces/${safe}/`;
}

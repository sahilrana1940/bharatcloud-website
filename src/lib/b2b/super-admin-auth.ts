import { isSuperAdminEmail, listSuperAdminEmails } from "@/lib/brand";

/** Server-only. Set on Vercel — never commit real passwords. */
export function verifySuperAdminPassword(password: string): boolean {
  const expected = process.env.SUPER_ADMIN_PASSWORD?.trim();
  const pass = String(password || "");
  if (pass.length < 6) return false;
  if (expected) return pass === expected;
  return pass.length >= 6;
}

export function assertSuperAdminEmail(email: string): boolean {
  return isSuperAdminEmail(email);
}

export { listSuperAdminEmails };

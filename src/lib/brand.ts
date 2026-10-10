export const BRAND_FOOTER =
  "🇮🇳 BharatCloud - 100% Made in India | Data Stored in Mumbai | Encrypted Vault | 60sec Secure URL";

export const SUPER_ADMIN_EMAIL = "admin@bharatcloud.store";

/** Legacy super admin (also full access) */
export const LEGACY_SUPER_ADMIN_EMAIL = "sahilrana1940@gmail.com";

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const e = email.toLowerCase();
  return e === SUPER_ADMIN_EMAIL || e === LEGACY_SUPER_ADMIN_EMAIL;
}

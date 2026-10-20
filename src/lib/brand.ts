export const BRAND_PRODUCT = "BharatCloud";
export const BRAND_PARENT = "Bharat Tijori";
export const BRAND_DOMAIN = "bharattijori.com";
export const BRAND_LEGACY_DOMAIN = "bharatcloud.store";

export const BRAND_TAGLINE = `${BRAND_PRODUCT} for Business — by ${BRAND_PARENT}`;

export const BRAND_FOOTER =
  `🇮🇳 ${BRAND_TAGLINE} · 100% Made in India | Mumbai-region storage | Encrypted vault | 60s secure download | All plans inclusive of taxes | GST Not Applicable | Cancel anytime`;

/** Primary platform super-admin login (also in default list). */
export const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

/** Legacy super admin (also full access) */
export const LEGACY_SUPER_ADMIN_EMAIL = "sahilrana1940@gmail.com";

const DEFAULT_SUPER_ADMINS = [
  SUPER_ADMIN_EMAIL,
  "support@bharatcloud.com",
  "admin@bharatcloud.store",
  LEGACY_SUPER_ADMIN_EMAIL,
];

export function listSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS?.trim();
  const fromEnv = raw
    ? raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const merged = new Set([...DEFAULT_SUPER_ADMINS.map((e) => e.toLowerCase()), ...fromEnv]);
  return [...merged];
}

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const e = email.toLowerCase();
  return listSuperAdminEmails().includes(e);
}

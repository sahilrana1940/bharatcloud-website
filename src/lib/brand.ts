export const BRAND_PRODUCT = "BharatCloud";
export const BRAND_PARENT = "Bharat Tijori";
export const BRAND_DOMAIN = "bharattijori.com";
export const BRAND_LEGACY_DOMAIN = "bharatcloud.store";

export const BRAND_TAGLINE = `${BRAND_PRODUCT} for Business — by ${BRAND_PARENT}`;

export const BRAND_FOOTER =
  `🇮🇳 ${BRAND_TAGLINE} · 100% Made in India | Mumbai-region storage | Encrypted vault | 60s secure download`;

export const SUPER_ADMIN_EMAIL = "admin@bharatcloud.store";

/** Legacy super admin (also full access) */
export const LEGACY_SUPER_ADMIN_EMAIL = "sahilrana1940@gmail.com";

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const e = email.toLowerCase();
  return e === SUPER_ADMIN_EMAIL || e === LEGACY_SUPER_ADMIN_EMAIL;
}

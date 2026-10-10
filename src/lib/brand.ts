export const BRAND_PRODUCT = "BharatCloud";
export const BRAND_PARENT = "Bharat Tijori";
export const BRAND_DOMAIN = "bharattijori.com";
export const BRAND_LEGACY_DOMAIN = "bharatcloud.store";

export const BRAND_TAGLINE = `${BRAND_PRODUCT} for Business — by ${BRAND_PARENT}`;

/** Public promise — align infra to this over time (see docs/BHARAT_INDIA_POSITIONING.md). */
export const BRAND_MISSION =
  "Bharat’s cloud for Indian companies — private storage, owner control, built in India.";

export const INDIA_TRUST_POINTS = [
  "India-first: built for Bharat’s businesses, not global consumer drive wars",
  "Private vault storage — no public file links; encrypted transfer",
  "Roadmap: South Asia / Mumbai-region data path as you scale pilots",
] as const;

export const BRAND_FOOTER =
  `🇮🇳 ${BRAND_TAGLINE} · Made in India · Private vault · ${BRAND_MISSION}`;

export const SUPER_ADMIN_EMAIL = "admin@bharatcloud.store";

/** Legacy super admin (also full access) */
export const LEGACY_SUPER_ADMIN_EMAIL = "sahilrana1940@gmail.com";

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const e = email.toLowerCase();
  return e === SUPER_ADMIN_EMAIL || e === LEGACY_SUPER_ADMIN_EMAIL;
}

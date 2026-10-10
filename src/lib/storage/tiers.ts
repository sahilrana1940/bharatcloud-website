export const BUCKET_COMPANY_HOT = "bharatcloud-company-hot";
export const BUCKET_PERSONAL_HOT = "bharatcloud-personal-hot";
export const BUCKET_COLD = "bharatcloud-cold";
export const BUCKET_VAULT = "bharatcloud-vault";
export const BUCKET_THUMBS = "bharatcloud-thumbs";

/** @deprecated use BUCKET_PERSONAL_HOT / BUCKET_COMPANY_HOT */
export const BUCKET_HOT = BUCKET_PERSONAL_HOT;

export const HOT_SIGNED_SEC = 60;
export const COLD_SIGNED_SEC = 120;
export const VAULT_SIGNED_SEC = 120;

export const COLD_AFTER_DAYS = 30;
export const B2B_VAULT_RETENTION_YEARS = 7;

export const PLAN_LIMITS = {
  free: 2 * 1024 ** 3,
  year_20gb: 20 * 1024 ** 3,
  year_100gb: 100 * 1024 ** 3,
} as const;

export function hotBucketFor(companyDomain: string | null) {
  return companyDomain ? BUCKET_COMPANY_HOT : BUCKET_PERSONAL_HOT;
}

export function detectBackupType(
  fileName: string,
  mime: string,
  companyDomain: string | null,
): "photo" | "video" | "whatsapp" | "file" | "company_doc" {
  if (companyDomain) return "company_doc";
  const n = fileName.toLowerCase();
  if (n.includes("whatsapp") || n.startsWith("wa_")) return "whatsapp";
  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic)$/i.test(n)) return "photo";
  if (mime.startsWith("video/") || /\.(mp4|mov|mkv|webm)$/i.test(n)) return "video";
  return "file";
}

export function storageObjectPath(email: string, fileName: string) {
  const safe = fileName.replace(/[/\\]/g, "_");
  return `${email.toLowerCase()}/${Date.now()}_${safe}`;
}

export { BRAND_FOOTER as INDIA_BADGE } from "@/lib/brand";

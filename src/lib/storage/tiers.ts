export const BUCKET_HOT = "bharatcloud-hot";
export const BUCKET_COLD = "bharatcloud-cold";
export const BUCKET_VAULT = "bharatcloud-vault";

export const HOT_SIGNED_SEC = 60;
export const COLD_SIGNED_SEC = 120;
export const VAULT_SIGNED_SEC = 120;

export const COLD_AFTER_DAYS = 30;
export const B2B_VAULT_RETENTION_YEARS = 7;

export function detectBackupType(fileName: string, mime: string): "photo" | "video" | "whatsapp" | "file" {
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

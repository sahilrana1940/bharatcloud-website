export function publicBackupUrl(s3Path: string | null | undefined): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !s3Path) return null;
  const encoded = s3Path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/bharatcloud-backups/${encoded}`;
}

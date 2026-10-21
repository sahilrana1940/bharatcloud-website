/** S3-compatible object storage (Wasabi, E2E, MinIO, etc.) */
export function getS3Env() {
  const endpoint =
    process.env.E2E_ENDPOINT?.trim() ||
    process.env.E2E_S3_ENDPOINT?.trim() ||
    process.env.WASABI_ENDPOINT?.trim() ||
    "";
  const region =
    process.env.WASABI_REGION?.trim() ||
    process.env.E2E_S3_REGION?.trim() ||
    "us-east-1";
  const accessKeyId =
    process.env.WASABI_ACCESS_KEY?.trim() ||
    process.env.E2E_ACCESS_KEY?.trim() ||
    process.env.E2E_S3_ACCESS_KEY?.trim() ||
    process.env.E2E_S3_ACCESS_KEY_ID?.trim() ||
    "";
  const secretAccessKey =
    process.env.WASABI_SECRET_KEY?.trim() ||
    process.env.E2E_SECRET_KEY?.trim() ||
    process.env.E2E_S3_SECRET_KEY?.trim() ||
    process.env.E2E_S3_SECRET_ACCESS_KEY?.trim() ||
    "";
  const b2bBucket =
    process.env.E2E_BUCKET?.trim() ||
    process.env.WASABI_B2B_BUCKET?.trim() ||
    process.env.E2E_S3_B2B_BUCKET?.trim() ||
    process.env.ARCHIVE_S3_BUCKET?.trim() ||
    "";
  const archiveBucket =
    process.env.E2E_BUCKET?.trim() ||
    process.env.ARCHIVE_S3_BUCKET?.trim() ||
    process.env.WASABI_ARCHIVE_BUCKET?.trim() ||
    process.env.E2E_S3_B2B_BUCKET?.trim() ||
    "";

  return { endpoint, region, accessKeyId, secretAccessKey, b2bBucket, archiveBucket };
}

export function getArchiveBucket() {
  return getS3Env().archiveBucket;
}

/** Bucket name from env. E2E_BUCKET wins; older Vercel names are fallbacks. */
export function getE2EBucket() {
  return (
    process.env.E2E_BUCKET?.trim() ||
    process.env.E2E_S3_B2B_BUCKET?.trim() ||
    process.env.ARCHIVE_S3_BUCKET?.trim() ||
    ""
  );
}

export function getE2EEndpoint() {
  return (process.env.E2E_ENDPOINT || process.env.E2E_S3_ENDPOINT || "").trim();
}

export function getE2ECredentials() {
  const accessKeyId = (
    process.env.E2E_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY_ID ||
    ""
  ).trim();
  const secretAccessKey = (
    process.env.E2E_SECRET_KEY ||
    process.env.E2E_S3_SECRET_KEY ||
    process.env.E2E_S3_SECRET_ACCESS_KEY ||
    ""
  ).trim();
  return { accessKeyId, secretAccessKey };
}

export function isS3Configured(): boolean {
  const { endpoint, accessKeyId, secretAccessKey } = getS3Env();
  return Boolean(endpoint && accessKeyId && secretAccessKey);
}

/** When set, every object upload uses archive class + archiver key layout from day 0. */
export function isArchiveFromStart(): boolean {
  const mode = process.env.STORAGE_MODE?.trim().toUpperCase();
  return mode === "ARCHIVE_FROM_START" || mode === "ARCHIVER_FROM_START";
}

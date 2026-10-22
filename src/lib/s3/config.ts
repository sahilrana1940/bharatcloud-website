/** S3-compatible object storage (E2E Chennai, Wasabi, MinIO, etc.) */

/** Delhi object store. Chennai is https://in-south1-objectstore.e2enetworks.net. Mumbai is retired. */
export const E2E_DELHI_ENDPOINT = "https://objectstore.e2enetworks.net";
export const E2E_CHENNAI_ENDPOINT = "https://in-south1-objectstore.e2enetworks.net";

/** Correct bucket spelling. The dashboard bucket "bharacloudfinal2" is a typo. */
export const E2E_BUCKET_DEFAULT = "bharatcloudfinal2";
export const E2E_BUCKET_TYPO = "bharacloudfinal2";

/** SigV4 region E2E accepts. The city is chosen by E2E_ENDPOINT, not this value. */
export const E2E_SIGNING_REGION = "us-east-1";

function isRetiredMumbaiEndpoint(url: string) {
  const host = url.toLowerCase();
  return host.includes("mumbai") || host.includes("mum-objectstore") || host.includes("ap-mumbai");
}

/** Raw endpoint from env. Empty when unset. ARCHIVE_E2E_ENDPOINT wins. */
export function getE2EEndpoint() {
  return (
    process.env.ARCHIVE_E2E_ENDPOINT ||
    process.env.E2E_ENDPOINT ||
    process.env.E2E_S3_ENDPOINT ||
    ""
  )
    .trim()
    .replace(/\/$/, "");
}

/**
 * Endpoint used for S3 calls. A retired Mumbai host is replaced with Chennai
 * so an old E2E_S3_ENDPOINT cannot keep the app on a dead region.
 */
export function resolveE2EEndpoint() {
  const raw = getE2EEndpoint();
  if (!raw) return E2E_DELHI_ENDPOINT;
  if (isRetiredMumbaiEndpoint(raw)) {
    console.warn(
      "[e2e-storage] Mumbai object storage endpoint is retired. Using https://objectstore.e2enetworks.net. For a Chennai key set E2E_ENDPOINT=https://in-south1-objectstore.e2enetworks.net.",
      { configured: raw, using: E2E_DELHI_ENDPOINT },
    );
    return E2E_DELHI_ENDPOINT;
  }
  return raw;
}

export function getE2ERegion() {
  const raw = (
    process.env.ARCHIVE_E2E_REGION ||
    process.env.E2E_REGION ||
    process.env.E2E_S3_REGION ||
    E2E_SIGNING_REGION
  ).trim();
  // E2E signs with us-east-1. "delhi" / "chennai" / "mumbai" select the endpoint, not SigV4.
  if (/mumbai|delhi|chennai|noida/i.test(raw)) {
    return E2E_SIGNING_REGION;
  }
  return raw || E2E_SIGNING_REGION;
}

export function getS3Env() {
  const e2eKeys = getE2ECredentials();
  const e2eConfigured = Boolean(getE2EEndpoint() || e2eKeys.accessKeyId || e2eKeys.secretAccessKey);
  const endpoint = e2eConfigured
    ? resolveE2EEndpoint()
    : process.env.WASABI_ENDPOINT?.trim() || "";
  const region = e2eConfigured
    ? getE2ERegion()
    : process.env.WASABI_REGION?.trim() || E2E_SIGNING_REGION;
  const accessKeyId = e2eConfigured
    ? e2eKeys.accessKeyId
    : process.env.WASABI_ACCESS_KEY?.trim() || "";
  const secretAccessKey = e2eConfigured
    ? e2eKeys.secretAccessKey
    : process.env.WASABI_SECRET_KEY?.trim() || "";
  const bucket = e2eConfigured ? getE2EBucket() : "";
  const b2bBucket = bucket || process.env.WASABI_B2B_BUCKET?.trim() || "";
  const archiveBucket =
    bucket ||
    process.env.ARCHIVE_S3_BUCKET?.trim() ||
    process.env.WASABI_ARCHIVE_BUCKET?.trim() ||
    "";

  return { endpoint, region, accessKeyId, secretAccessKey, b2bBucket, archiveBucket };
}

export function getArchiveBucket() {
  return getS3Env().archiveBucket;
}

/** Bucket from env. ARCHIVE_E2E_BUCKET wins. Spaces are stripped. */
export function getE2EBucket() {
  const name = (
    process.env.ARCHIVE_E2E_BUCKET ||
    process.env.E2E_BUCKET_NAME ||
    process.env.E2E_BUCKET ||
    process.env.E2E_S3_B2B_BUCKET ||
    process.env.ARCHIVE_S3_BUCKET ||
    "bharacloudfinal2"
  ).replace(/\s+/g, "");
  return name || "bharacloudfinal2";
}

export function getE2ECredentials() {
  const accessKeyId = (
    process.env.ARCHIVE_E2E_ACCESS_KEY_ID ||
    process.env.E2E_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY_ID ||
    ""
  ).trim();
  const secretAccessKey = (
    process.env.ARCHIVE_E2E_SECRET_ACCESS_KEY ||
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

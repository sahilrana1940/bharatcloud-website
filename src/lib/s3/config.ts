/** S3-compatible object storage (Wasabi, E2E, MinIO, etc.) */
export function getS3Env() {
  const endpoint =
    process.env.WASABI_ENDPOINT?.trim() ||
    process.env.E2E_S3_ENDPOINT?.trim() ||
    "";
  const region =
    process.env.WASABI_REGION?.trim() ||
    process.env.E2E_S3_REGION?.trim() ||
    "us-east-1";
  const accessKeyId =
    process.env.WASABI_ACCESS_KEY?.trim() ||
    process.env.E2E_S3_ACCESS_KEY?.trim() ||
    "";
  const secretAccessKey =
    process.env.WASABI_SECRET_KEY?.trim() ||
    process.env.E2E_S3_SECRET_KEY?.trim() ||
    "";
  const b2bBucket =
    process.env.WASABI_B2B_BUCKET?.trim() ||
    process.env.E2E_S3_B2B_BUCKET?.trim() ||
    "bharatcloud-vault";

  return { endpoint, region, accessKeyId, secretAccessKey, b2bBucket };
}

export function isS3Configured(): boolean {
  const { endpoint, accessKeyId, secretAccessKey } = getS3Env();
  return Boolean(endpoint && accessKeyId && secretAccessKey);
}

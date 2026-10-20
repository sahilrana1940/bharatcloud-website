import { S3Client } from "@aws-sdk/client-s3";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";
import { s3CompatibleClientOptions } from "@/lib/s3/config";
import { uploadAsArchiver } from "@/lib/storage/archiver-from-start";

export { calculateBill, E2E_RATES };

const ARCHIVE_BUCKET =
  process.env.ARCHIVE_S3_BUCKET?.trim() ||
  process.env.E2E_S3_B2B_BUCKET?.trim() ||
  "bharatcloudfinal2";

export function getE2EClient(): S3Client | null {
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
  if (!accessKeyId || !secretAccessKey) return null;

  return new S3Client(
    s3CompatibleClientOptions({
      endpoint: (process.env.E2E_S3_ENDPOINT || "https://mumbai.e2e.cloud").trim(),
      region: (process.env.E2E_S3_REGION || "mumbai").trim(),
      accessKeyId,
      secretAccessKey,
    }),
  );
}

export function bucketForKey(_key: string): string {
  return ARCHIVE_BUCKET;
}

/** Upload always lands in bharatcloudfinal2 as GLACIER-class archive from day 1. */
export async function uploadToE2E(
  file: File,
  orgId: string,
): Promise<{ bucket: string; key: string }> {
  if (!getE2EClient()) {
    throw new Error("E2E credentials missing. Set E2E_ACCESS_KEY and E2E_SECRET_KEY.");
  }
  return uploadAsArchiver(file, orgId, null, "drive");
}

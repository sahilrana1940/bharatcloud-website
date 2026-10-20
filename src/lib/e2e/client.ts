import { S3Client } from "@aws-sdk/client-s3";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";
import { getS3Client } from "@/lib/s3/client";
import { getE2EBucket } from "@/lib/s3/config";
import { uploadAsArchiver } from "@/lib/storage/archiver-from-start";

export { calculateBill, E2E_RATES };

export function getE2EClient(): S3Client | null {
  return getS3Client();
}

export function bucketForKey(_key: string): string {
  return getE2EBucket();
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

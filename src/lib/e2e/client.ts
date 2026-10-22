import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";
import {
  getE2EBucket,
  getE2ECredentials,
  getE2ERegion,
  resolveE2EEndpoint,
} from "@/lib/s3/config";

export { calculateBill, E2E_RATES };

let cachedClient: S3Client | null = null;
let cachedKey = "";

function envForcePathStyle(): boolean {
  const v = process.env.E2E_FORCE_PATH_STYLE?.trim().toLowerCase();
  if (v === "0" || v === "false") return false;
  return true;
}

/** SDK client for list/get. Uploads use fetch SigV4, not this handler. */
export function createE2EClient(opts?: {
  endpoint?: string;
  forcePathStyle?: boolean;
}): S3Client | null {
  const endpoint = (opts?.endpoint || resolveE2EEndpoint()).replace(/\/$/, "");
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  const forcePathStyle = opts?.forcePathStyle ?? envForcePathStyle();

  return new S3Client({
    region: getE2ERegion(),
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 3,
    retryMode: "standard",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new FetchHttpHandler({ requestTimeout: 120_000 }),
  } as S3ClientConfig);
}

/** Single cached E2E client for normal SDK use. */
export function getE2EClient(): S3Client | null {
  const endpoint = resolveE2EEndpoint();
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  const key = `${endpoint}|${getE2ERegion()}|${accessKeyId}|${envForcePathStyle()}`;
  if (cachedClient && cachedKey === key) return cachedClient;

  cachedClient = createE2EClient();
  cachedKey = key;
  return cachedClient;
}

export function bucketForKey(_key: string): string {
  return getE2EBucket();
}

/** Upload always lands in the env bucket as an archive copy. */
export async function uploadToE2E(
  file: File,
  orgId: string,
): Promise<{ bucket: string; key: string }> {
  if (!getE2EClient()) {
    throw new Error("E2E credentials missing. Set E2E_ENDPOINT, E2E_ACCESS_KEY and E2E_SECRET_KEY.");
  }
  const { uploadAsArchiver } = await import("@/lib/storage/archiver-from-start");
  return uploadAsArchiver(file, orgId, null, "drive");
}

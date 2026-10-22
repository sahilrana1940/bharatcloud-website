import https from "node:https";

import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";
import { getE2EBucket, getE2ECredentials, getE2ERegion, resolveE2EEndpoint } from "@/lib/s3/config";

export { calculateBill, E2E_RATES };

/** Fresh IPv4 TLS 1.2 socket. Reused keep-alive sockets fail the handshake on Vercel. */
const tlsAgent = new https.Agent({
  keepAlive: false,
  family: 4,
  rejectUnauthorized: true,
  secureProtocol: "TLSv1_2_method",
});

let cachedClient: S3Client | null = null;
let cachedKey = "";

/** Single E2E client. Endpoint, region, and keys come from env. */
export function getE2EClient(): S3Client | null {
  const endpoint = resolveE2EEndpoint();
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  const key = `${endpoint}|${getE2ERegion()}|${accessKeyId}`;
  if (cachedClient && cachedKey === key) return cachedClient;

  cachedClient = new S3Client({
    region: getE2ERegion(),
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 5,
    retryMode: "adaptive",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new NodeHttpHandler({
      httpsAgent: tlsAgent,
      connectionTimeout: 15_000,
      requestTimeout: 120_000,
      socketTimeout: 120_000,
    }),
  } as S3ClientConfig);
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

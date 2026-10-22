import { HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

import { infraFromUsage } from "@/lib/admin/platform-costs";
import { getE2EClient } from "@/lib/e2e/client";
import {
  E2E_BUCKET_DEFAULT,
  E2E_BUCKET_TYPO,
  E2E_CHENNAI_ENDPOINT,
  E2E_DELHI_ENDPOINT,
  getE2EBucket,
  getE2ECredentials,
  getE2ERegion,
  resolveE2EEndpoint,
} from "@/lib/s3/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type StorageMeasure = {
  ok: boolean;
  usedGb: number;
  usedBytes: number;
  objectCount: number;
  bucket: string;
  endpoint: string;
  region: string;
  measuredAt: string;
  warning?: string;
  error?: string;
  code?: string;
};

const CACHE_MS = 45_000;
let cache: { at: number; result: StorageMeasure } | null = null;

type S3Failure = {
  code: string;
  message: string;
  httpStatus?: number;
  requestId?: string;
};

function describeS3Error(err: unknown): S3Failure {
  const e = err as {
    name?: string;
    Code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number; requestId?: string };
  };
  const httpStatus = e.$metadata?.httpStatusCode;
  let code = e.Code || e.name || "S3Error";
  if ((code === "Unknown" || code === "UnknownError") && httpStatus === 403) code = "AccessDenied";
  return {
    code,
    message: e.message || "Unknown S3 error",
    httpStatus,
    requestId: e.$metadata?.requestId,
  };
}

function logS3Error(op: string, bucket: string, endpoint: string, region: string, info: S3Failure) {
  console.error(`[e2e-storage] ${info.code} during ${op}`, {
    code: info.code,
    message: info.message,
    httpStatus: info.httpStatus,
    requestId: info.requestId,
    bucket,
    endpoint,
    region,
  });
}

function bytesToGb(bytes: number) {
  return Math.round((bytes / 1024 ** 3) * 1000) / 1000;
}

function missingConfigError(): string {
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  const missing: string[] = [];
  if (!accessKeyId) missing.push("E2E_ACCESS_KEY");
  if (!secretAccessKey) missing.push("E2E_SECRET_KEY");
  const where = missing.length ? `Missing ${missing.join(" and ")}.` : "E2E client could not be created.";
  return `${where} Set them on the host (Hostinger or Vercel), not in git. Endpoint ${resolveE2EEndpoint()}. Delhi ${E2E_DELHI_ENDPOINT}. Chennai ${E2E_CHENNAI_ENDPOINT}. Bucket E2E_BUCKET_NAME=${getE2EBucket()}. Use the access key and secret for the key named "bharat", not the name itself.`;
}

async function headBucket(bucket: string) {
  const client = getE2EClient();
  const endpoint = resolveE2EEndpoint();
  const region = getE2ERegion();
  if (!client) return { ok: false as const, error: missingConfigError(), code: "MissingCredentials" };
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true as const };
  } catch (err) {
    const info = describeS3Error(err);
    logS3Error("HeadBucket", bucket, endpoint, region, info);
    return { ok: false as const, error: info.message, code: info.code };
  }
}

async function sumBucket(bucket: string): Promise<
  | { ok: true; usedBytes: number; objectCount: number }
  | { ok: false; error: string; code: string }
> {
  const client = getE2EClient();
  const endpoint = resolveE2EEndpoint();
  const region = getE2ERegion();
  if (!client) return { ok: false, error: missingConfigError(), code: "MissingCredentials" };

  let usedBytes = 0;
  let objectCount = 0;
  let token: string | undefined;
  let pages = 0;
  try {
    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: token,
          MaxKeys: 1000,
        }),
      );
      for (const item of page.Contents || []) {
        usedBytes += Number(item.Size || 0);
        objectCount += 1;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
      pages += 1;
    } while (token && pages < 200);
    return { ok: true, usedBytes, objectCount };
  } catch (err) {
    const info = describeS3Error(err);
    logS3Error("ListObjectsV2", bucket, endpoint, region, info);
    const access =
      info.code === "InvalidAccessKeyId"
        ? `InvalidAccessKeyId on ${endpoint}. This key exists on a different E2E region. Delhi keys use https://objectstore.e2enetworks.net. Chennai keys use https://in-south1-objectstore.e2enetworks.net. Set E2E_ENDPOINT to the region where the "bharat" key was created.`
        : info.code === "AccessDenied" || info.httpStatus === 403
          ? `AccessDenied on ListObjectsV2 for bucket "${bucket}". Endpoint ${endpoint}, region ${region}. The key authenticates, but it is not allowed to list this bucket. In E2E → Object Storage → Manage Access, grant the "bharat" key ListBucket on "${bucket}". ${info.message}`
          : `${info.code}: ${info.message}`;
    return { ok: false, error: access, code: info.code };
  }
}

async function persist(result: StorageMeasure) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !result.ok) return;
  const infra = infraFromUsage(result.usedGb);
  const { error } = await supabase.from("platform_storage_meter").upsert({
    id: "e2e",
    used_bytes: result.usedBytes,
    used_gb: result.usedGb,
    object_count: result.objectCount,
    bucket: result.bucket,
    endpoint: result.endpoint,
    region: result.region,
    storage_cost_inr: infra.storage,
    error: result.warning || null,
    measured_at: result.measuredAt,
  });
  if (error) {
    console.error("[e2e-storage] Could not write platform_storage_meter", {
      message: error.message,
      code: error.code,
    });
  }
}

export function getCachedStorageMeasure() {
  if (!cache) return null;
  if (Date.now() - cache.at > CACHE_MS) return null;
  return cache.result;
}

export async function measureE2EStorage(opts?: { force?: boolean }): Promise<StorageMeasure> {
  if (!opts?.force) {
    const hit = getCachedStorageMeasure();
    if (hit) return hit;
  }

  const endpoint = resolveE2EEndpoint();
  const region = getE2ERegion();
  const primary = getE2EBucket();
  const measuredAt = new Date().toISOString();
  const base = { endpoint, region, measuredAt, usedGb: 0, usedBytes: 0, objectCount: 0, bucket: primary };

  if (!getE2EClient()) {
    const result: StorageMeasure = { ...base, ok: false, code: "MissingCredentials", error: missingConfigError() };
    console.error("[e2e-storage] MissingCredentials", { endpoint, region, bucket: primary });
    return result;
  }

  let bucket = primary;
  let warning: string | undefined;
  const head = await headBucket(primary);
  if (!head.ok) {
    console.error("[e2e-storage] HeadBucket did not succeed; measuring with ListObjectsV2", {
      bucket: primary,
      code: head.code,
      endpoint,
      region,
    });
  }

  let summed = await sumBucket(primary);
  if (!summed.ok && primary === E2E_BUCKET_DEFAULT) {
    const typo = await sumBucket(E2E_BUCKET_TYPO);
    if (typo.ok) {
      bucket = E2E_BUCKET_TYPO;
      summed = typo;
      warning = `Measured existing bucket "${E2E_BUCKET_TYPO}" (missing t). Create or rename it to "${E2E_BUCKET_DEFAULT}" and set E2E_BUCKET_NAME.`;
      console.warn("[e2e-storage]", warning);
    }
  }
  if (!summed.ok) {
    const result: StorageMeasure = { ...base, bucket, ok: false, code: summed.code, error: summed.error, warning };
    return result;
  }

  const result: StorageMeasure = {
    ...base,
    ok: true,
    bucket,
    usedBytes: summed.usedBytes,
    usedGb: bytesToGb(summed.usedBytes),
    objectCount: summed.objectCount,
    warning,
  };
  cache = { at: Date.now(), result };
  await persist(result);
  return result;
}

export function storageFixMessage(result: StorageMeasure) {
  if (!result.ok) return result.error || "Storage measurement failed";
  const empty = result.objectCount === 0 ? " Bucket is reachable and empty." : "";
  const warn = result.warning ? ` ${result.warning}` : "";
  return `Storage measured: ${result.usedGb.toFixed(3)} GB (${result.objectCount} objects) in ${result.bucket}.${empty}${warn}`;
}

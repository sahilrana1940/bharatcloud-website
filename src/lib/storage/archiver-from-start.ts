import { PutObjectCommand, type StorageClass } from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";

import { insertFileArchiveRow } from "@/lib/archive/save-file-archive-row";
import { e2eWorkspacePrefix } from "@/lib/roles/platform-roles";
import { getS3Client } from "@/lib/s3/client";
import { getE2EBucket, isArchiveFromStart, isS3Configured } from "@/lib/s3/config";

export const ARCHIVER_BUCKET =
  process.env.ARCHIVE_E2E_BUCKET?.trim() ||
  process.env.E2E_BUCKET?.trim() ||
  process.env.E2E_S3_B2B_BUCKET?.trim() ||
  process.env.ARCHIVE_S3_BUCKET?.trim() ||
  "";

export function archiveStorageClass(): StorageClass {
  const raw =
    process.env.ARCHIVE_STORAGE_CLASS?.trim() ||
    process.env.ARCHIVE_S3_STORAGE_CLASS?.trim() ||
    "GLACIER";
  return raw as StorageClass;
}

export function driveArchiveKey(orgId: string, fileName: string, domain?: string) {
  const safe = fileName.replace(/[/\\]/g, "_");
  if (domain) {
    return `${e2eWorkspacePrefix(domain)}archive/drive/${Date.now()}-${safe}`;
  }
  return `archive/drive/${orgId}/${Date.now()}-${safe}`;
}

export function emailArchiveKey(orgId: string, messageId: string, d = new Date()) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `archive/email/${orgId}/${year}/${month}/${messageId}.eml`;
}

export function emailArchivePrefix(orgId: string, d = new Date()) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `archive/email/${orgId}/${year}/${month}/`;
}

function gmailArchiveMetadata() {
  const at = new Date().toISOString();
  return {
    "archive-from": at,
    source: "gmail-backup",
    retention: "7-years",
    type: "archiver-start",
  };
}

function driveArchiveMetadata(originalName: string) {
  return {
    archivedAt: new Date().toISOString(),
    originalName,
    retention: "7-years",
    type: "archiver-start",
  };
}

export async function putArchiverObject(opts: {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
  bucket?: string;
}): Promise<{ ok: true; bucket: string; key: string } | { ok: false; error: string }> {
  if (!isS3Configured()) {
    return {
      ok: false,
      error: "E2E Chennai storage not configured — set E2E_ENDPOINT, E2E_ACCESS_KEY, and E2E_SECRET_KEY on the host.",
    };
  }
  const client = getS3Client();
  if (!client) return { ok: false, error: "S3 client unavailable" };

  const bucket = opts.bucket || getE2EBucket() || ARCHIVER_BUCKET;
  if (!bucket) return { ok: false, error: "E2E_BUCKET is not set" };
  const storageClass = isArchiveFromStart() ? archiveStorageClass() : undefined;
  const attempts: Array<{ StorageClass?: StorageClass; Metadata?: Record<string, string> }> = [
    {
      ...(storageClass ? { StorageClass: storageClass } : {}),
      ...(opts.metadata ? { Metadata: opts.metadata } : {}),
    },
    {},
  ];

  let lastError = "Archive upload failed";
  for (const extra of attempts) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: opts.key,
          Body: opts.body,
          ContentType: opts.contentType,
          ...extra,
        }),
      );
      return { ok: true, bucket, key: opts.key };
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      lastError = err instanceof Error ? err.message : "Archive upload failed";
      if (!/access denied/i.test(lastError)) break;
    }
  }
  return { ok: false, error: lastError };
}

export async function uploadAsArchiver(
  file: File,
  orgId: string,
  supabase?: SupabaseClient | null,
  source: "drive" | "gmail" | "email" = "drive",
): Promise<{ bucket: string; key: string }> {
  const key = driveArchiveKey(orgId, file.name);
  const body = Buffer.from(await file.arrayBuffer());
  const up = await putArchiverObject({
    key,
    body,
    contentType: file.type || "application/octet-stream",
    metadata: driveArchiveMetadata(file.name),
  });
  if (!up.ok) throw new Error(up.error);

  if (supabase) {
    await insertFileArchiveRow(supabase, {
      org_id: orgId,
      file_name: file.name,
      s3_bucket: up.bucket,
      s3_key: up.key,
      storage_class: String(archiveStorageClass()),
      source,
      size_mb: body.length / (1024 * 1024),
      is_from_start: true,
    });
  }

  return { bucket: up.bucket, key: up.key };
}

export async function archiveGmailEml(opts: {
  orgId: string;
  messageId: string;
  body: Buffer;
  supabase?: SupabaseClient;
}): Promise<{ ok: true; key: string; bucket: string } | { ok: false; error: string }> {
  const key = emailArchiveKey(opts.orgId, opts.messageId);
  const up = await putArchiverObject({
    key,
    body: opts.body,
    contentType: "message/rfc822",
    metadata: gmailArchiveMetadata(),
  });
  if (!up.ok) return up;

  if (opts.supabase) {
    await insertFileArchiveRow(opts.supabase, {
      org_id: opts.orgId,
      file_name: `${opts.messageId}.eml`,
      s3_bucket: up.bucket,
      s3_key: up.key,
      storage_class: String(archiveStorageClass()),
      source: "gmail",
      size_mb: opts.body.length / (1024 * 1024),
      is_from_start: true,
    });
  }

  return { ok: true, key: up.key, bucket: up.bucket };
}

/** @deprecated Use driveArchiveKey — kept for callers migrating keys. */
export function archiveObjectKey(companyId: string, fileName: string) {
  return driveArchiveKey(companyId, fileName);
}

import type { StorageClass } from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";

import { putObjectSigned } from "@/lib/e2e/signed-put";
import { insertFileArchiveRow } from "@/lib/archive/save-file-archive-row";
import { e2eWorkspacePrefix } from "@/lib/roles/platform-roles";
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

export function gmailArchiveKey(userEmail: string, messageId: string, d = new Date()) {
  const year = d.getUTCFullYear();
  return `gmail/${userEmail.trim().toLowerCase()}/${year}/${messageId}.eml`;
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
  storageClass?: StorageClass;
}): Promise<{ ok: true; bucket: string; key: string } | { ok: false; error: string }> {
  if (!isS3Configured()) {
    return {
      ok: false,
      error: "E2E Chennai storage not configured — set E2E_ENDPOINT, E2E_ACCESS_KEY, and E2E_SECRET_KEY on the host.",
    };
  }
  const bucket = (opts.bucket || process.env.ARCHIVE_E2E_BUCKET || getE2EBucket() || ARCHIVER_BUCKET || "").replace(
    /\s+/g,
    "",
  );
  if (!bucket) return { ok: false, error: "ARCHIVE_E2E_BUCKET is not set" };
  const storageClass = opts.storageClass || (isArchiveFromStart() ? archiveStorageClass() : undefined);
  const sent = await putObjectSigned({
    bucket,
    key: opts.key,
    body: opts.body,
    contentType: opts.contentType,
    storageClass,
    metadata: opts.metadata,
  });
  if (!sent.ok) return { ok: false, error: sent.error };
  return { ok: true, bucket, key: opts.key };
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

  return { bucket: up.bucket, key: up.key };
}

export async function archiveGmailEml(opts: {
  orgId: string;
  userId?: string | null;
  userEmail?: string;
  messageId: string;
  body: Buffer;
  supabase?: SupabaseClient;
}): Promise<{ ok: true; key: string; bucket: string } | { ok: false; error: string }> {
  if (!opts.userEmail) return { ok: false, error: "Gmail archive needs the mailbox address" };
  const key = gmailArchiveKey(opts.userEmail, opts.messageId);
  const bucket = process.env.ARCHIVE_E2E_BUCKET?.trim();
  if (!bucket) return { ok: false, error: "ARCHIVE_E2E_BUCKET is not set" };

  let up = await putArchiverObject({
    key,
    body: opts.body,
    contentType: "message/rfc822",
    bucket,
    storageClass: "GLACIER",
  });
  if (!up.ok && /storage class|403|400/i.test(up.error)) {
    up = await putArchiverObject({
      key,
      body: opts.body,
      contentType: "message/rfc822",
      bucket,
      storageClass: "STANDARD" as StorageClass,
    });
  }
  if (!up.ok) return up;

  const indexed = await insertFileArchiveRow(opts.supabase, {
    org_id: opts.orgId,
    user_id: opts.userId ?? null,
    gmail_message_id: opts.messageId,
    user_email: opts.userEmail.trim().toLowerCase(),
    file_name: `${opts.messageId}.eml`,
    s3_key: key,
    source: "gmail",
    size_bytes: opts.body.length,
    storage_class: "GLACIER",
  });
  if (!indexed.ok) return { ok: false, error: indexed.error };

  return { ok: true, key: up.key, bucket: up.bucket };
}

/** @deprecated Use driveArchiveKey — kept for callers migrating keys. */
export function archiveObjectKey(companyId: string, fileName: string) {
  return driveArchiveKey(companyId, fileName);
}

// src/lib/s3/config.ts - storage provider none; legacy names are empty stubs
// STORAGE_PROVIDER = "none" | "supabase" | "idrive"

export type StorageProvider = "none" | "supabase" | "idrive";

export function getStorageProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || "none";
}

export function getS3Config() {
  const provider = getStorageProvider();

  if (provider === "none") {
    return null; // E2E Deleted - safe
  }

  if (provider === "supabase") {
    return { provider: "supabase", bucket: "bharatcloud-files" };
  }

  if (provider === "idrive") {
    return {
      provider: "idrive",
      bucket: process.env.IDRIVE_E2_BUCKET!,
      endpoint: process.env.IDRIVE_E2_ENDPOINT!,
    };
  }

  return null;
}

export function isArchiveEnabled() {
  return getStorageProvider() !== "none";
}

// Disabled stubs so older imports compile. Storage provider stays "none".
export const E2E_DELHI_ENDPOINT = "";
export const E2E_CHENNAI_ENDPOINT = "";
export const E2E_BUCKET_DEFAULT = "";
export const E2E_BUCKET_TYPO = "";
export const E2E_SIGNING_REGION = "";

export function getE2EBucket() {
  return "";
}
export function getE2ERegion() {
  return "";
}
export function getE2EEndpoint() {
  return "";
}
export function resolveE2EEndpoint() {
  return "";
}
export function getE2ECredentials() {
  return { accessKeyId: "", secretAccessKey: "" };
}
export function isS3Configured() {
  return false;
}
export function isArchiveFromStart() {
  return false;
}
export function getArchiveBucket() {
  return "";
}
export function getS3Env() {
  return { b2bBucket: "", bucket: "", endpoint: "", region: "", accessKeyId: "", secretAccessKey: "" };
}
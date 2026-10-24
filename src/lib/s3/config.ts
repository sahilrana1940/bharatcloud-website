// src/lib/s3/config.ts - FUTURE SAFE
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

// Purane imports crash na ho isliye dummy - par use nahi honge
export const E2E_DELHI_ENDPOINT = "";
export const E2E_BUCKET_DEFAULT = "";
export const E2E_SIGNING_REGION = "";
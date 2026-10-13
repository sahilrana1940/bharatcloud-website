import { listB3Files } from "@/lib/b3/repository";
import { bytesToGb, getS3Client, listCompanyFiles } from "@/lib/s3/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Legacy demo cap when no B3 files exist yet. */
export const B3_DEMO_GB = 120;

/** ₹ per GB-month (Bharat Big Bucket list price). */
export const B3_INR_PER_GB = 244 / B3_DEMO_GB;

export function b3AmountInr(gb: number): number {
  return Math.max(0, Math.round(gb * B3_INR_PER_GB));
}

function bytesToGbRounded(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 100) / 100;
}

/** Vault / Drive fallback when B3 bucket is empty (older tenants). */
export async function companyB3StorageGbFromVault(
  supabase: SupabaseClient,
  companyId: string,
): Promise<number> {
  const { data: users } = await supabase
    .from("company_users")
    .select("drive_used_gb")
    .eq("company_id", companyId);

  let gb = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);

  const client = getS3Client();
  if (client) {
    try {
      const objects = await listCompanyFiles(client, companyId);
      const bytes = objects.reduce((sum, o) => sum + (o.Size || 0), 0);
      const fromS3 = bytesToGb(bytes) || bytes / 1024 ** 3;
      gb = Math.max(gb, fromS3);
    } catch {
      /* keep DB aggregate */
    }
  }

  return Math.round(gb * 10) / 10;
}

/**
 * Monthly billing b3 line — sourced from Bharat Big Bucket (`b3_files` / demo store),
 * not generic Drive quota.
 */
export async function companyB3StorageGbForBilling(
  supabase: SupabaseClient | null,
  companyId: string,
): Promise<number> {
  const { usedBytes } = await listB3Files(supabase, companyId);
  if (usedBytes > 0) {
    return bytesToGbRounded(usedBytes);
  }
  if (supabase) {
    const vaultGb = await companyB3StorageGbFromVault(supabase, companyId);
    if (vaultGb > 0) return vaultGb;
  }
  return 0;
}

/** @deprecated Use companyB3StorageGbForBilling */
export async function companyB3StorageGb(
  supabase: SupabaseClient,
  companyId: string,
): Promise<number> {
  const fromBucket = await companyB3StorageGbForBilling(supabase, companyId);
  if (fromBucket > 0) return fromBucket;
  return companyB3StorageGbFromVault(supabase, companyId);
}

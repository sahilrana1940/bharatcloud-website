import { bytesToGb, getS3Client, listCompanyFiles } from "@/lib/s3/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Demo / fallback when DB has no drive metrics yet. */
export const B3_DEMO_GB = 120;

/** ₹ per GB-month (matches demo line: 120 GB → ₹244). */
export const B3_INR_PER_GB = 244 / B3_DEMO_GB;

export function b3AmountInr(gb: number): number {
  return Math.max(0, Math.round(gb * B3_INR_PER_GB));
}

export async function companyB3StorageGb(
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
      const fromS3 = bytesToGb(bytes) || bytes / (1024 ** 3);
      gb = Math.max(gb, fromS3);
    } catch {
      /* keep DB aggregate */
    }
  }

  return Math.round(gb * 10) / 10;
}

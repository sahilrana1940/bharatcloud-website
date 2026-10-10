import {
  BUCKET_COLD,
  BUCKET_THUMBS,
  BUCKET_VAULT,
  COLD_SIGNED_SEC,
  HOT_SIGNED_SEC,
  hotBucketFor,
} from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function signThumbPath(thumbPath: string) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) return `/api/personal/demo-thumb?p=${encodeURIComponent(thumbPath)}`;
  const { data } = await supabase.storage
    .from(BUCKET_THUMBS)
    .createSignedUrl(thumbPath, HOT_SIGNED_SEC);
  return data?.signedUrl || null;
}

export async function signHotOrCold(
  row: {
    company_domain: string | null;
    hot_path: string | null;
    cold_path: string | null;
    vault_path: string;
    storage_tier: string;
    is_deleted: boolean;
  },
  vaultOnly = false,
) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) return null;
  const hotBucket = hotBucketFor(row.company_domain);
  let bucket = hotBucket;
  let path = row.hot_path;
  let exp = HOT_SIGNED_SEC;
  if (vaultOnly || (!row.hot_path && !row.cold_path)) {
    bucket = BUCKET_VAULT;
    path = row.vault_path;
    exp = HOT_SIGNED_SEC;
  } else if (row.storage_tier === "cold" && row.cold_path) {
    bucket = BUCKET_COLD;
    path = row.cold_path;
    exp = COLD_SIGNED_SEC;
  }
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, exp);
  return data?.signedUrl || null;
}

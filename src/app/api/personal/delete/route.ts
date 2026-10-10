import { NextResponse } from "next/server";

import { demoVaultGet, demoVaultUpdate } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import { BUCKET_COLD, hotBucketFor } from "@/lib/storage/tiers";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const row = demoVaultGet(id);
    if (!row || row.user_email !== ctx.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    demoVaultUpdate(id, { is_deleted: true, hot_path: null, cold_path: null });
    return NextResponse.json({ ok: true, vaultRetained: true });
  }

  const { data: row } = await supabase
    .from(VAULT_TABLE)
    .select("*")
    .eq("id", id)
    .eq("user_email", ctx.email)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hotBucket = hotBucketFor(row.company_domain as string | null);
  if (row.hot_path) await supabase.storage.from(hotBucket).remove([row.hot_path as string]);
  if (row.cold_path) await supabase.storage.from(BUCKET_COLD).remove([row.cold_path as string]);

  await supabase
    .from(VAULT_TABLE)
    .update({
      is_deleted: true,
      hot_path: null,
      cold_path: null,
      storage_tier: "cold",
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, vaultRetained: true });
}

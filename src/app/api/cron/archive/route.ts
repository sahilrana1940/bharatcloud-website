import { NextResponse } from "next/server";

import { demoAllVault, demoVaultUpdate } from "@/lib/personal/demo-store";
import { BUCKET_COLD, COLD_AFTER_DAYS, hotBucketFor } from "@/lib/storage/tiers";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COLD_AFTER_DAYS);
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    let moved = 0;
    for (const row of demoAllVault()) {
      if (row.storage_tier !== "hot" || row.is_deleted) continue;
      if (new Date(row.created_at) >= cutoff) continue;
      demoVaultUpdate(row.id, { storage_tier: "cold", cold_path: row.hot_path });
      moved += 1;
    }
    return NextResponse.json({ ok: true, moved, demo: true });
  }

  const { data: rows } = await supabase
    .from(VAULT_TABLE)
    .select("*")
    .eq("storage_tier", "hot")
    .eq("is_deleted", false)
    .lt("created_at", cutoff.toISOString());

  let moved = 0;
  for (const row of rows || []) {
    const hotPath = row.hot_path as string;
    if (!hotPath) continue;
    const hotBucket = hotBucketFor(row.company_domain as string | null);
    const { data: blob, error: dlErr } = await supabase.storage.from(hotBucket).download(hotPath);
    if (dlErr || !blob) continue;

    const { error: upErr } = await supabase.storage
      .from(BUCKET_COLD)
      .upload(hotPath, blob, { upsert: true, contentType: row.mime_type || undefined });
    if (upErr) continue;

    await supabase
      .from(VAULT_TABLE)
      .update({ storage_tier: "cold", cold_path: hotPath })
      .eq("id", row.id);

    await supabase.storage.from(hotBucket).remove([hotPath]);
    moved += 1;
  }

  return NextResponse.json({ ok: true, moved, scanned: rows?.length || 0 });
}

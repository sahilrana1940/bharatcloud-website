import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { demoStorageStats } from "@/lib/personal/demo-store";
import {
  BUCKET_COLD,
  BUCKET_COMPANY_HOT,
  BUCKET_PERSONAL_HOT,
  BUCKET_VAULT,
  hotBucketFor,
} from "@/lib/storage/tiers";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

function bytesToGb(n: number) {
  return (n / 1024 ** 3).toFixed(2);
}

export async function GET() {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const d = demoStorageStats();
    const coldGb = parseFloat(bytesToGb(d.cold));
    return NextResponse.json({
      hotGb: bytesToGb(d.hot),
      coldGb: bytesToGb(d.cold),
      vaultGb: bytesToGb(d.vault),
      costSavedInr: Math.round(coldGb * 15),
      buckets: [BUCKET_PERSONAL_HOT, BUCKET_COMPANY_HOT, BUCKET_COLD, BUCKET_VAULT],
    });
  }

  const { data } = await supabase.from(VAULT_TABLE).select("file_size, storage_tier, is_deleted");
  let hot = 0;
  let cold = 0;
  let vault = 0;
  for (const r of data || []) {
    const sz = Number(r.file_size || 0);
    vault += sz;
    if (r.storage_tier === "cold") cold += sz;
    else if (!r.is_deleted) hot += sz;
  }
  const coldGb = parseFloat(bytesToGb(cold));
  return NextResponse.json({
    hotGb: bytesToGb(hot),
    coldGb: bytesToGb(cold),
    vaultGb: bytesToGb(vault),
    costSavedInr: Math.round(coldGb * 15),
    buckets: [BUCKET_PERSONAL_HOT, BUCKET_COMPANY_HOT, BUCKET_COLD, BUCKET_VAULT],
  });
}

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { backupId } = await req.json();
  if (!backupId) {
    return NextResponse.json({ error: "backupId required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { data: row } = await supabase.from(VAULT_TABLE).select("*").eq("id", backupId).maybeSingle();
  if (!row?.vault_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: blob } = await supabase.storage.from(BUCKET_VAULT).download(row.vault_path as string);
  if (!blob) {
    return NextResponse.json({ error: "Vault object missing" }, { status: 404 });
  }

  const hotBucket = hotBucketFor(row.company_domain as string | null);
  const hotPath = row.vault_path as string;
  await supabase.storage.from(hotBucket).upload(hotPath, blob, {
    upsert: true,
    contentType: row.mime_type || undefined,
  });

  await supabase
    .from(VAULT_TABLE)
    .update({
      is_deleted: false,
      storage_tier: "hot",
      hot_path: hotPath,
      last_accessed: new Date().toISOString(),
    })
    .eq("id", backupId);

  return NextResponse.json({ ok: true, restored: backupId });
}

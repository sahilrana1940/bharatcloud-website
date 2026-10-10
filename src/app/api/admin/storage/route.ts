import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { demoStorageStats } from "@/lib/personal/demo-store";
import { BUCKET_COLD, BUCKET_HOT, BUCKET_VAULT } from "@/lib/storage/tiers";
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
    const hotGb = bytesToGb(d.hot);
    const coldGb = bytesToGb(d.cold);
    const vaultGb = bytesToGb(d.vault);
    const saved = Math.round(parseFloat(coldGb) * 15);
    return NextResponse.json({
      hotGb,
      coldGb,
      vaultGb,
      costSavedInr: saved,
      buckets: [BUCKET_HOT, BUCKET_COLD, BUCKET_VAULT],
    });
  }

  const { data } = await supabase.from("personal_backups").select("file_size, storage_tier, is_deleted");
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
    buckets: [BUCKET_HOT, BUCKET_COLD, BUCKET_VAULT],
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

  const { data: row } = await supabase
    .from("personal_backups")
    .select("*")
    .eq("id", backupId)
    .maybeSingle();

  if (!row?.vault_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: blob } = await supabase.storage.from(BUCKET_VAULT).download(row.vault_path as string);
  if (!blob) {
    return NextResponse.json({ error: "Vault object missing" }, { status: 404 });
  }

  const hotPath = row.vault_path as string;
  await supabase.storage.from(BUCKET_HOT).upload(hotPath, blob, {
    upsert: true,
    contentType: row.mime_type || undefined,
  });

  await supabase
    .from("personal_backups")
    .update({
      is_deleted: false,
      storage_tier: "hot",
      hot_path: hotPath,
      hot_url: hotPath,
      last_accessed: new Date().toISOString(),
    })
    .eq("id", backupId);

  return NextResponse.json({ ok: true, restored: backupId });
}

import { NextResponse } from "next/server";

import { demoGetUser, demoUpdateUser } from "@/lib/personal/users-demo";
import { demoVaultInsert, type VaultRow } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import {
  BUCKET_VAULT,
  detectBackupType,
  hotBucketFor,
  storageObjectPath,
} from "@/lib/storage/tiers";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const typeParam = form.get("type")?.toString();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.replace(/[/\\]/g, "_");
  const objectPath = storageObjectPath(ctx.email, fileName);
  const mime = file.type || "application/octet-stream";
  const type = (typeParam as VaultRow["type"]) || detectBackupType(fileName, mime, ctx.companyDomain);
  const hotBucket = hotBucketFor(ctx.companyDomain);
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    const user = demoGetUser(ctx.email);
    if (user.storage_used_bytes + file.size > user.storage_limit_bytes) {
      return NextResponse.json({ error: "Storage limit exceeded" }, { status: 403 });
    }
    const id = `pv-${Date.now()}`;
    const row: VaultRow = {
      id,
      user_email: ctx.email,
      company_domain: ctx.companyDomain,
      file_name: fileName,
      file_size: file.size,
      type,
      hot_path: objectPath,
      cold_path: null,
      vault_path: objectPath,
      storage_tier: "hot",
      is_deleted: false,
      is_locked: true,
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      mime_type: mime,
    };
    demoVaultInsert(row);
    demoUpdateUser(ctx.email, { storage_used_bytes: user.storage_used_bytes + file.size });
    return NextResponse.json({ ok: true, id, tier: "hot" });
  }

  const { error: hotErr } = await supabase.storage
    .from(hotBucket)
    .upload(objectPath, buffer, { upsert: true, contentType: mime });
  if (hotErr) {
    return NextResponse.json({ error: hotErr.message }, { status: 500 });
  }

  const { error: vaultErr } = await supabase.storage
    .from(BUCKET_VAULT)
    .upload(objectPath, buffer, { upsert: true, contentType: mime });
  if (vaultErr) {
    return NextResponse.json({ error: vaultErr.message }, { status: 500 });
  }

  const { data: row, error: dbErr } = await supabase
    .from(VAULT_TABLE)
    .insert({
      user_email: ctx.email,
      company_domain: ctx.companyDomain,
      file_name: fileName,
      file_size: file.size,
      type,
      hot_path: objectPath,
      vault_path: objectPath,
      storage_tier: "hot",
      is_locked: true,
      mime_type: mime,
    })
    .select()
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id, tier: "hot" });
}

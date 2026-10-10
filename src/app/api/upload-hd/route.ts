import { NextResponse } from "next/server";

import {
  demoPersonalInsert,
  type PersonalBackupRow,
} from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import {
  BUCKET_HOT,
  BUCKET_VAULT,
  detectBackupType,
  storageObjectPath,
} from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.replace(/[/\\]/g, "_");
  const objectPath = storageObjectPath(ctx.email, fileName);
  const mime = file.type || "application/octet-stream";
  const type = detectBackupType(fileName, mime);
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    const id = `pb-${Date.now()}`;
    const row: PersonalBackupRow = {
      id,
      user_email: ctx.email,
      file_name: fileName,
      hot_path: objectPath,
      cold_path: null,
      vault_path: objectPath,
      hot_url: objectPath,
      cold_url: null,
      vault_url: objectPath,
      file_size: file.size,
      type,
      storage_tier: "hot",
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      is_deleted: false,
      company_domain: ctx.companyDomain,
      mime_type: mime,
    };
    demoPersonalInsert(row);
    return NextResponse.json({ ok: true, id, tier: "hot" });
  }

  const { error: hotErr } = await supabase.storage
    .from(BUCKET_HOT)
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
    .from("personal_backups")
    .insert({
      user_email: ctx.email,
      file_name: fileName,
      hot_path: objectPath,
      vault_path: objectPath,
      hot_url: objectPath,
      vault_url: objectPath,
      file_size: file.size,
      type,
      storage_tier: "hot",
      last_accessed: new Date().toISOString(),
      company_domain: ctx.companyDomain,
      mime_type: mime,
    })
    .select()
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id, tier: "hot" });
}

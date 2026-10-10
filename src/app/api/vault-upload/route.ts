import { NextResponse } from "next/server";

import { demoGetUser, demoUpdateUser } from "@/lib/personal/users-demo";
import { demoVaultInsert, type VaultRow } from "@/lib/personal/demo-store";
import { emailDomain } from "@/lib/google/client";
import { getUploadContext } from "@/lib/personal/access";
import { generateWebpThumb, thumbObjectPath } from "@/lib/storage/thumbnail";
import {
  BUCKET_THUMBS,
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
  const thumbPath = thumbObjectPath(ctx.email, fileName);
  const mime = file.type || "application/octet-stream";
  const companyDomain =
    ctx.companyDomain || (ctx.isB2C ? null : emailDomain(ctx.email));
  const type: VaultRow["type"] = companyDomain
    ? "company_doc"
    : ((typeParam as VaultRow["type"]) ||
        detectBackupType(fileName, mime, companyDomain));
  const hotBucket = hotBucketFor(companyDomain);
  const supabase = await getSupabaseOrNull();

  let thumbBuf: Buffer | null = null;
  try {
    thumbBuf = await generateWebpThumb(buffer);
  } catch {
    thumbBuf = null;
  }

  if (!supabase) {
    const user = demoGetUser(ctx.email);
    if (user.is_blocked) return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    if (user.storage_used + file.size > user.storage_limit) {
      return NextResponse.json({ error: "Storage limit exceeded" }, { status: 403 });
    }
    const id = `pv-${Date.now()}`;
    const row: VaultRow = {
      id,
      user_email: ctx.email,
      company_domain: companyDomain,
      file_name: fileName,
      file_size: file.size,
      type,
      hot_path: objectPath,
      cold_path: null,
      vault_path: objectPath,
      thumb_path: thumbPath,
      storage_tier: "hot",
      is_deleted: false,
      is_locked: true,
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      mime_type: mime,
    };
    demoVaultInsert(row);
    demoUpdateUser(ctx.email, { storage_used: user.storage_used + file.size });
    return NextResponse.json({ ok: true, id, tier: "hot" });
  }

  const { error: hotErr } = await supabase.storage
    .from(hotBucket)
    .upload(objectPath, buffer, { upsert: true, contentType: mime });
  if (hotErr) {
    return NextResponse.json({ error: hotErr.message }, { status: 500 });
  }

  if (thumbBuf) {
    await supabase.storage.from(BUCKET_THUMBS).upload(thumbPath, thumbBuf, {
      upsert: true,
      contentType: "image/webp",
    });
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
      company_domain: companyDomain,
      file_name: fileName,
      file_size: file.size,
      type,
      hot_path: objectPath,
      vault_path: objectPath,
      thumb_path: thumbBuf ? thumbPath : null,
      storage_tier: "hot",
      is_locked: true,
      mime_type: mime,
    })
    .select()
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const { data: pu } = await supabase
    .from("personal_users")
    .select("storage_used")
    .eq("email", ctx.email)
    .maybeSingle();
  await supabase.from("personal_users").upsert({
    email: ctx.email,
    storage_used: Number(pu?.storage_used || 0) + file.size,
  });

  return NextResponse.json({ ok: true, id: row.id, tier: "hot" });
}

import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { demoPersonalGet, demoPersonalUpdate } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import {
  BUCKET_COLD,
  BUCKET_HOT,
  BUCKET_VAULT,
  COLD_SIGNED_SEC,
  HOT_SIGNED_SEC,
  VAULT_SIGNED_SEC,
} from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  const role = await getSessionRole();

  if (!supabase) {
    const row = demoPersonalGet(id);
    if (!row || row.user_email !== ctx.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (row.is_deleted && role?.role !== "super_admin") {
      return NextResponse.json({ error: "Deleted — contact admin to restore" }, { status: 403 });
    }
    demoPersonalUpdate(id, { last_accessed: new Date().toISOString() });
    return NextResponse.json({
      url: `/api/personal/demo-file?id=${id}`,
      tier: row.storage_tier,
      expiresIn: HOT_SIGNED_SEC,
    });
  }

  const { data: row, error } = await supabase
    .from("personal_backups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.user_email !== ctx.email && role?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (row.is_deleted && role?.role !== "super_admin") {
    return NextResponse.json({ error: "Deleted — vault restore required" }, { status: 403 });
  }

  let bucket = BUCKET_HOT;
  let path = row.hot_path as string;
  let expires = HOT_SIGNED_SEC;

  if (row.is_deleted && role?.role === "super_admin") {
    bucket = BUCKET_VAULT;
    path = row.vault_path as string;
    expires = VAULT_SIGNED_SEC;
  } else if (row.storage_tier === "cold" && row.cold_path) {
    bucket = BUCKET_COLD;
    path = row.cold_path as string;
    expires = COLD_SIGNED_SEC;
  } else if (!row.hot_path && row.vault_path) {
    bucket = BUCKET_VAULT;
    path = row.vault_path as string;
    expires = VAULT_SIGNED_SEC;
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expires);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message || "Sign failed" }, { status: 500 });
  }

  await supabase
    .from("personal_backups")
    .update({ last_accessed: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({
    url: signed.signedUrl,
    tier: row.storage_tier,
    expiresIn: expires,
  });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { demoGetLock, demoIsUnlocked } from "@/lib/personal/locks-demo";
import { demoVaultGet, demoVaultUpdate } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import {
  BUCKET_COLD,
  BUCKET_VAULT,
  COLD_SIGNED_SEC,
  HOT_SIGNED_SEC,
  hotBucketFor,
} from "@/lib/storage/tiers";
import { canAccessVaultFile } from "@/lib/vault/access";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const UNLOCK_COOKIE = "bc_vault_unlocked";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jar = await cookies();
  const unlocked = jar.get(UNLOCK_COOKIE)?.value === ctx.email;
  const supabase = await getSupabaseOrNull();
  const role = await getSessionRole();

  if (!supabase) {
    const lock = demoGetLock(ctx.email);
    if (lock?.is_device_locked) {
      return NextResponse.json({ error: "Device locked — use recovery" }, { status: 403 });
    }
    if (lock && !demoIsUnlocked(ctx.email) && !unlocked) {
      return NextResponse.json({ error: "PIN required" }, { status: 403 });
    }
    const row = demoVaultGet(id);
    if (!row || !(await canAccessVaultFile(row, ctx.email))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    demoVaultUpdate(id, { last_accessed: new Date().toISOString() });
    const res = NextResponse.json({
      signedUrl: `/api/personal/demo-file?id=${id}`,
      tier: row.storage_tier,
      expiresIn: HOT_SIGNED_SEC,
    });
    return res;
  }

  const { data: lock } = await supabase
    .from("app_locks")
    .select("*")
    .eq("user_email", ctx.email)
    .maybeSingle();

  if (lock?.is_device_locked) {
    return NextResponse.json({ error: "Device locked" }, { status: 403 });
  }
  if (lock && !unlocked) {
    return NextResponse.json({ error: "PIN required" }, { status: 403 });
  }

  const { data: row, error } = await supabase.from(VAULT_TABLE).select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canAccessVaultFile(row, ctx.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotBucket = hotBucketFor(row.company_domain as string | null);
  let bucket = hotBucket;
  let path = row.hot_path as string;
  let expires = HOT_SIGNED_SEC;

  if (row.storage_tier === "cold" && row.cold_path) {
    bucket = BUCKET_COLD;
    path = row.cold_path as string;
    expires = COLD_SIGNED_SEC;
  } else if (!row.hot_path) {
    bucket = BUCKET_VAULT;
    path = row.vault_path as string;
    expires = HOT_SIGNED_SEC;
  }

  if (row.is_deleted && role?.role === "super_admin") {
    bucket = BUCKET_VAULT;
    path = row.vault_path as string;
  } else if (row.is_deleted) {
    return NextResponse.json({ error: "Deleted" }, { status: 403 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expires);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message || "Sign failed" }, { status: 500 });
  }

  await supabase
    .from(VAULT_TABLE)
    .update({ last_accessed: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    tier: row.storage_tier,
    expiresIn: expires,
  });
}

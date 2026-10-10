import { NextResponse } from "next/server";

import { demoPersonalGet, demoPersonalUpdate } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import { BUCKET_COLD, BUCKET_HOT } from "@/lib/storage/tiers";
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
    const row = demoPersonalGet(id);
    if (!row || row.user_email !== ctx.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    demoPersonalUpdate(id, { is_deleted: true, hot_url: null, cold_url: null });
    return NextResponse.json({ ok: true, soft: true });
  }

  const { data: row } = await supabase
    .from("personal_backups")
    .select("*")
    .eq("id", id)
    .eq("user_email", ctx.email)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.hot_path) {
    await supabase.storage.from(BUCKET_HOT).remove([row.hot_path as string]);
  }
  if (row.cold_path) {
    await supabase.storage.from(BUCKET_COLD).remove([row.cold_path as string]);
  }

  await supabase
    .from("personal_backups")
    .update({
      is_deleted: true,
      hot_path: null,
      cold_path: null,
      hot_url: null,
      cold_url: null,
      storage_tier: "vault",
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, soft: true, vaultRetained: true });
}

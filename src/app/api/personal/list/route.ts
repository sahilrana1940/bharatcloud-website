import { NextResponse } from "next/server";

import { demoPersonalList } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const items = demoPersonalList(ctx.email).map((r) => ({
      id: r.id,
      file_name: r.file_name,
      file_size: r.file_size,
      type: r.type,
      storage_tier: r.storage_tier,
      is_deleted: r.is_deleted,
      created_at: r.created_at,
    }));
    return NextResponse.json({ items, b2c: !ctx.companyDomain });
  }

  let query = supabase
    .from("personal_backups")
    .select("id, file_name, file_size, type, storage_tier, is_deleted, created_at")
    .eq("user_email", ctx.email)
    .order("created_at", { ascending: false });

  if (!ctx.companyDomain) {
    query = query.is("company_domain", null);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data || [],
    b2c: !ctx.companyDomain,
  });
}

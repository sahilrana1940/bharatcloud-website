import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getS3Client, restoreFromTrash } from "@/lib/s3/client";

export async function POST(req: Request) {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trashId } = await req.json();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { data: row, error } = await supabase
    .from("vault_trash")
    .select("*")
    .eq("id", trashId)
    .eq("company_id", companyId)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Trash item not found" }, { status: 404 });
  }

  const client = getS3Client();
  if (!client) {
    return NextResponse.json({ error: "S3 not configured" }, { status: 503 });
  }

  await restoreFromTrash(client, row.trash_key, row.file_key);
  await supabase.from("vault_trash").delete().eq("id", trashId);

  return NextResponse.json({ ok: true, restored: row.file_key });
}

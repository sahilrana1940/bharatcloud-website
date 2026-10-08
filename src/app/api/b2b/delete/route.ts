import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { demoTrash } from "@/lib/b2b/demo-store";
import { getS3Client, softDeleteFile } from "@/lib/s3/client";

export async function POST(req: Request) {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, originalName } = await req.json();
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  const client = getS3Client();
  if (!client) {
    return NextResponse.json({ error: "S3 not configured" }, { status: 503 });
  }

  const { trashKey, versionId } = await softDeleteFile(
    client,
    companyId,
    String(key),
  );

  const row = {
    id: crypto.randomUUID(),
    company_id: companyId,
    file_key: String(key),
    original_name: originalName || key.split("/").pop() || "file",
    deleted_at: new Date().toISOString(),
    s3_version_id: versionId,
    trash_key: trashKey,
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    demoTrash.push(row);
    return NextResponse.json({ ok: true, trash: row });
  }

  const { error } = await supabase.from("vault_trash").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

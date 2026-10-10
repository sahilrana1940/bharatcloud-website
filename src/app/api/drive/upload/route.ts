import { NextResponse } from "next/server";

import { publicBackupUrl } from "@/lib/drive/public-url";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { BUCKET_COMPANY_HOT } from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const BUCKET = BUCKET_COMPANY_HOT;

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const baseName = file.name.replace(/[/\\]/g, "_");
  const fileName = `${Date.now()}_${baseName}`;
  const ownerEmail = session.email.toLowerCase();
  const domain = await resolveCompanyDomain(session.companyId, ownerEmail);
  const storagePath = `${domain}/${ownerEmail}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    const publicUrl =
      publicBackupUrl(storagePath) ||
      `https://www.bharatcloud.store/demo/${encodeURIComponent(storagePath)}`;
    const row = {
      id: driveFileId,
      company_id: session.companyId,
      company_domain: domain,
      owner_email: ownerEmail,
      drive_file_id: driveFileId,
      name: baseName,
      file_name: baseName,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      file_size: file.size,
      web_view_link: "",
      s3_path: storagePath,
      public_url: publicUrl,
      backup_status: "backedup" as const,
      is_shortcut: false,
      is_deleted: false,
      shared: false,
      created_at: new Date().toISOString(),
    };
    DEMO_DRIVE_FILES.unshift(row);
    return NextResponse.json({ ok: true, publicUrl, file: toClientFile(row, publicUrl) });
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrl = publicBackupUrl(storagePath) || "";

  const { data: row, error: dbError } = await supabase
    .from("drive_files")
    .insert({
      company_id: session.companyId,
      company_domain: domain,
      owner_email: ownerEmail,
      drive_file_id: driveFileId,
      name: baseName,
      file_name: baseName,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      file_size: file.size,
      s3_path: storagePath,
      public_url: publicUrl,
      backup_status: "backedup",
      is_shortcut: false,
      is_deleted: false,
      shared: false,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    publicUrl,
    file: toClientFile(row, publicUrl),
  });
}

function toClientFile(row: Record<string, unknown>, publicUrl: string) {
  return {
    id: row.id,
    drive_file_id: row.drive_file_id,
    name: row.file_name || row.name,
    owner_email: row.owner_email,
    size: row.file_size ?? row.size,
    mime_type: row.mime_type,
    publicLink: publicUrl,
    is_shortcut: row.is_shortcut,
  };
}

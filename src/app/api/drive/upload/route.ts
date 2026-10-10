import { NextResponse } from "next/server";

import { publicBackupUrl } from "@/lib/drive/public-url";
import { emailDomain } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_COMPANY_ID, DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const BUCKET = "bharatcloud-backups";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const fileName = file.name.replace(/[/\\]/g, "_");
  const ownerEmail = session.email.toLowerCase();
  const supabase = await getSupabaseOrNull();

  let domain = emailDomain(ownerEmail);
  if (supabase) {
    const { data: company } = await supabase
      .from("companies")
      .select("domain")
      .eq("id", session.companyId)
      .maybeSingle();
    if (company?.domain) domain = company.domain;
  } else if (session.companyId === DEMO_COMPANY_ID) {
    domain = "rjadam.com";
  }

  const storagePath = `${domain}/${ownerEmail}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFileId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  if (!supabase) {
    const row = {
      id: driveFileId,
      company_id: session.companyId,
      owner_email: ownerEmail,
      drive_file_id: driveFileId,
      name: fileName,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      web_view_link: "",
      s3_path: storagePath,
      backup_status: "backedup" as const,
      is_shortcut: false,
    };
    DEMO_DRIVE_FILES.unshift(row);
    const publicUrl =
      publicBackupUrl(storagePath) ||
      `https://www.bharatcloud.store/demo/${encodeURIComponent(storagePath)}`;
    return NextResponse.json({
      ok: true,
      publicUrl,
      file: {
        id: row.id,
        drive_file_id: row.drive_file_id,
        name: row.name,
        owner_email: row.owner_email,
        size: row.size,
        mime_type: row.mime_type,
        publicLink: publicUrl,
        is_shortcut: false,
      },
    });
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

  const { data: row, error: dbError } = await supabase
    .from("drive_files")
    .insert({
      company_id: session.companyId,
      owner_email: ownerEmail,
      drive_file_id: driveFileId,
      name: fileName,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
      s3_path: storagePath,
      backup_status: "backedup",
      is_shortcut: false,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl || publicBackupUrl(storagePath);

  return NextResponse.json({
    ok: true,
    publicUrl,
    file: {
      id: row.id,
      drive_file_id: row.drive_file_id,
      name: row.name,
      owner_email: row.owner_email,
      size: row.size,
      mime_type: row.mime_type,
      publicLink: publicUrl,
      is_shortcut: row.is_shortcut,
    },
  });
}

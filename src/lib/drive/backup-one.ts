import type { SupabaseClient } from "@supabase/supabase-js";

import { driveClient } from "@/lib/google/client";
import { prepareUploadBody } from "@/lib/storage/compress-upload";

import { BUCKET_COMPANY_HOT } from "@/lib/storage/tiers";

const BUCKET = BUCKET_COMPANY_HOT;

export async function backupDriveFile(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    domain: string;
    ownerEmail: string;
    driveFileId: string;
    accessToken: string;
  },
) {
  const drive = driveClient(opts.accessToken);
  if (!drive) throw new Error("Drive client unavailable");

  const meta = await drive.files.get({
    fileId: opts.driveFileId,
    fields: "id,name,mimeType,size,webViewLink",
  });
  const f = meta.data;
  if (!f.id || !f.name) throw new Error("File not found on Google Drive");

  let fileName = f.name;
  let storagePath = `${opts.domain}/${opts.ownerEmail}/${fileName}`;

  await supabase.from("drive_files").upsert(
    {
      company_id: opts.companyId,
      owner_email: opts.ownerEmail,
      drive_file_id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      size: Number(f.size || 0),
      web_view_link: f.webViewLink,
      s3_path: storagePath,
      backup_status: "pending",
    },
    { onConflict: "company_id,drive_file_id" },
  );

  if (f.mimeType?.startsWith("application/vnd.google-apps")) {
    await supabase
      .from("drive_files")
      .update({ backup_status: "backedup" })
      .eq("company_id", opts.companyId)
      .eq("drive_file_id", f.id);
    return { storagePath, skippedBinary: true };
  }

  const media = await drive.files.get(
    { fileId: f.id, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const raw = Buffer.from(media.data as ArrayBuffer);
  const prepared = await prepareUploadBody(raw, f.mimeType);
  if (prepared.fileNameSuffix) {
    const base = fileName.replace(/\.[^.]+$/, "");
    fileName = `${base}.webp`;
    storagePath = `${opts.domain}/${opts.ownerEmail}/${fileName}`;
  }

  await supabase.storage.from(BUCKET).upload(storagePath, prepared.body, {
    upsert: true,
    contentType: prepared.contentType,
  });

  await supabase
    .from("drive_files")
    .update({
      name: fileName,
      s3_path: storagePath,
      backup_status: "backedup",
    })
    .eq("company_id", opts.companyId)
    .eq("drive_file_id", f.id);

  return { storagePath, publicUrl: null };
}

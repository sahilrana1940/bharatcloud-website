import { NextResponse } from "next/server";

import { driveClient } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const BUCKET = "bharatcloud-backups";

export async function POST() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      message: "Demo sync complete",
      files: DEMO_DRIVE_FILES.length,
    });
  }

  const { data: users } = await supabase
    .from("company_users")
    .select("email")
    .eq("company_id", session.companyId)
    .eq("is_backup_enabled", true);

  const { data: company } = await supabase
    .from("companies")
    .select("domain")
    .eq("id", session.companyId)
    .single();

  let backed = 0;
  for (const u of users || []) {
    const { data: tok } = await supabase
      .from("google_oauth_tokens")
      .select("access_token")
      .eq("company_id", session.companyId)
      .eq("email", u.email)
      .maybeSingle();
    if (!tok?.access_token) continue;

    const drive = driveClient(tok.access_token);
    if (!drive) continue;

    const listed = await drive.files.list({
      pageSize: 50,
      fields: "files(id,name,mimeType,size,webViewLink)",
      q: "trashed=false",
    });

    for (const f of listed.data.files || []) {
      if (!f.id || !f.name) continue;
      const path = `${company?.domain}/${u.email}/${f.name}`;
      await supabase.from("drive_files").upsert(
        {
          company_id: session.companyId,
          owner_email: u.email,
          drive_file_id: f.id,
          name: f.name,
          mime_type: f.mimeType,
          size: Number(f.size || 0),
          web_view_link: f.webViewLink,
          s3_path: path,
          backup_status: "backedup",
        },
        { onConflict: "company_id,drive_file_id" },
      );

      if (f.mimeType?.startsWith("application/vnd.google-apps")) continue;
      try {
        const media = await drive.files.get(
          { fileId: f.id, alt: "media" },
          { responseType: "arraybuffer" },
        );
        await supabase.storage
          .from(BUCKET)
          .upload(path, Buffer.from(media.data as ArrayBuffer), {
            upsert: true,
            contentType: f.mimeType || "application/octet-stream",
          });
        backed += 1;
      } catch {
        /* skip binary download errors in sync batch */
      }
    }
  }

  return NextResponse.json({ ok: true, filesBackedUp: backed });
}

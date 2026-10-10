import { NextResponse } from "next/server";

import { backupDriveFile } from "@/lib/drive/backup-one";
import { driveClient } from "@/lib/google/client";
import { publicBackupUrl } from "@/lib/drive/public-url";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_DRIVE_FILES, DEMO_GOOGLE_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  let body: { driveFileId?: string; ownerEmail?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const supabase = await getSupabaseOrNull();

  // Single-file backup
  if (body.driveFileId) {
    const ownerEmail = (body.ownerEmail || session.email).toLowerCase();
    if (session.role === "member" && ownerEmail !== session.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!supabase) {
      const g = DEMO_GOOGLE_DRIVE_FILES.find(
        (f) => f.drive_file_id === body.driveFileId,
      );
      if (g) {
        const s3_path = `rjadam.com/${g.owner_email}/${g.name}`;
        const copy = {
          id: `df-demo-${Date.now()}`,
          company_id: g.company_id,
          company_domain: "rjadam.com",
          owner_email: g.owner_email,
          drive_file_id: g.drive_file_id,
          name: g.name,
          file_name: g.name,
          mime_type: g.mime_type,
          size: g.size,
          file_size: g.size,
          web_view_link: g.web_view_link,
          s3_path,
          public_url: publicBackupUrl(s3_path) || "",
          backup_status: "backedup" as const,
          is_shortcut: false,
          is_deleted: false,
          shared: false,
          created_at: new Date().toISOString(),
        };
        DEMO_DRIVE_FILES.push(copy);
        return NextResponse.json({
          ok: true,
          publicLink: publicBackupUrl(copy.s3_path),
        });
      }
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("domain")
      .eq("id", session.companyId)
      .single();

    const { data: tok } = await supabase
      .from("google_oauth_tokens")
      .select("access_token")
      .eq("company_id", session.companyId)
      .eq("email", ownerEmail)
      .maybeSingle();

    if (!tok?.access_token || !company?.domain) {
      return NextResponse.json({ error: "Google token missing" }, { status: 400 });
    }

    try {
      const result = await backupDriveFile(supabase, {
        companyId: session.companyId,
        domain: company.domain,
        ownerEmail,
        driveFileId: body.driveFileId,
        accessToken: tok.access_token,
      });
      return NextResponse.json({
        ok: true,
        publicLink: publicBackupUrl(result.storagePath),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Backup failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Full sync (all enabled users)
  if (!supabase) {
    return NextResponse.json({
      message: "Demo sync complete",
      files: DEMO_DRIVE_FILES.length,
    });
  }

  let usersQuery = supabase
    .from("company_users")
    .select("email")
    .eq("company_id", session.companyId)
    .eq("is_backup_enabled", true);
  if (body.ownerEmail) {
    usersQuery = usersQuery.eq("email", body.ownerEmail.toLowerCase());
  }
  const { data: users } = await usersQuery;

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
      try {
        await backupDriveFile(supabase, {
          companyId: session.companyId,
          domain: company?.domain || "unknown",
          ownerEmail: u.email,
          driveFileId: f.id,
          accessToken: tok.access_token,
        });
        backed += 1;
      } catch {
        /* continue batch */
      }
    }
  }

  return NextResponse.json({ ok: true, filesBackedUp: backed });
}

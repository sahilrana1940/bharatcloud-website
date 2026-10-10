import { publicBackupUrl } from "@/lib/drive/public-url";
import { driveClient } from "@/lib/google/client";
export type DriveListItem = {
  id: string;
  drive_file_id: string;
  name: string;
  owner_email: string;
  size: number;
  mime_type?: string | null;
  web_view_link?: string | null;
  backup_status?: string;
  is_shortcut?: boolean;
  publicLink: string | null;
  source: "google" | "bharatcloud";
};
import {
  DEMO_DRIVE_FILES,
  DEMO_GOOGLE_DRIVE_FILES,
} from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function listDriveFiles(opts: {
  source: string;
  session: { companyId: string; email: string; role: "admin" | "member" };
  ownerParam: string;
}) {
  const { session, source, ownerParam } = opts;
  const ownerEmail = ownerParam || session.email;

  if (source === "google") {
    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      const files: DriveListItem[] = DEMO_GOOGLE_DRIVE_FILES
        .filter((f) => session.role === "admin" || f.owner_email === session.email)
        .filter(
          (f) =>
            !ownerParam ||
            f.owner_email === ownerEmail ||
            (session.role === "admin" && !ownerParam),
        )
        .map((f) => ({
          id: f.id,
          drive_file_id: f.drive_file_id,
          name: f.name,
          owner_email: f.owner_email,
          size: f.size,
          mime_type: f.mime_type,
          web_view_link: f.web_view_link,
          publicLink: null,
          source: "google",
        }));
      return { files, ownerEmail: session.email, error: null };
    }

    const targetOwner =
      session.role === "member" ? session.email : ownerEmail;

    const { data: tok } = await supabase
      .from("google_oauth_tokens")
      .select("access_token")
      .eq("company_id", session.companyId)
      .eq("email", targetOwner)
      .maybeSingle();

    if (!tok?.access_token) {
      return {
        files: [],
        ownerEmail: targetOwner,
        error: "Connect Google for this user (login with Google Workspace).",
      };
    }

    const drive = driveClient(tok.access_token);
    if (!drive) {
      return { files: [], ownerEmail: targetOwner, error: "Drive unavailable" };
    }

    const listed = await drive.files.list({
      pageSize: 50,
      fields: "files(id,name,size,mimeType,owners,webViewLink)",
      q: "trashed=false",
    });

    const files: DriveListItem[] = (listed.data.files || [])
      .filter((f) => f.id && f.name)
      .map((f) => ({
        id: f.id!,
        drive_file_id: f.id!,
        name: f.name!,
        owner_email:
          f.owners?.[0]?.emailAddress?.toLowerCase() || targetOwner,
        size: Number(f.size || 0),
        mime_type: f.mimeType,
        web_view_link: f.webViewLink,
        publicLink: null,
        source: "google",
      }));

    return { files, ownerEmail: targetOwner, error: null };
  }

  const supabase = await getSupabaseOrNull();
  let rows = DEMO_DRIVE_FILES;
  if (supabase) {
    let query = supabase
      .from("drive_files")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("backup_status", "backedup");
    if (session.role === "member") {
      query = query.eq("owner_email", session.email);
    } else if (ownerParam) {
      query = query.eq("owner_email", ownerParam);
    }
    const { data } = await query.order("name");
    rows = data || [];
  } else if (session.role === "member") {
    rows = rows.filter((f) => f.owner_email === session.email);
  }

  const files: DriveListItem[] = rows.map((f) => ({
    id: f.id,
    drive_file_id: f.drive_file_id,
    name: f.name,
    owner_email: f.owner_email,
    size: Number(f.size || 0),
    mime_type: f.mime_type,
    web_view_link: f.web_view_link,
    backup_status: f.backup_status,
    is_shortcut: f.is_shortcut,
    publicLink: publicBackupUrl(f.s3_path),
    source: "bharatcloud",
  }));

  return { files, ownerEmail: session.email, error: null };
}

import { publicBackupUrl } from "@/lib/drive/public-url";
import { driveClient } from "@/lib/google/client";
import {
  DEMO_DRIVE_FILES,
  DEMO_GOOGLE_DRIVE_FILES,
} from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

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

function mapRow(f: Record<string, unknown>): DriveListItem {
  const s3 = f.s3_path as string | undefined;
  const pub = (f.public_url as string) || publicBackupUrl(s3);
  return {
    id: String(f.id),
    drive_file_id: String(f.drive_file_id),
    name: String(f.file_name || f.name),
    owner_email: String(f.owner_email),
    size: Number(f.file_size ?? f.size ?? 0),
    mime_type: f.mime_type as string | null,
    web_view_link: f.web_view_link as string | null,
    backup_status: f.backup_status as string,
    is_shortcut: Boolean(f.is_shortcut),
    publicLink: pub,
    source: "bharatcloud",
  };
}

export async function listDriveFiles(opts: {
  mode: "google" | "bharatcloud" | "shared" | "recent" | "trash" | "vault" | "my-uploads";
  session: {
    companyId: string;
    email: string;
    role: "admin" | "member";
    saasRole?: "super_admin" | "company_owner" | "employee";
  };
  ownerParam: string;
  search: string;
}) {
  const { session, mode, ownerParam, search } = opts;
  const saasRole = session.saasRole || (session.role === "admin" ? "company_owner" : "employee");
  const supabase = await getSupabaseOrNull();

  if (mode === "google") {
    if (!supabase) {
      const shortcutDb = DEMO_DRIVE_FILES.filter((f) => f.is_shortcut);
      const live = DEMO_GOOGLE_DRIVE_FILES;
      const merged = [...shortcutDb, ...live].map((f) => ({
        id: f.id,
        drive_file_id: f.drive_file_id,
        name: f.name,
        owner_email: f.owner_email,
        size: f.size,
        mime_type: f.mime_type,
        publicLink: null,
        source: "google" as const,
      }));
      return { files: merged, error: null };
    }

    const { data: shortcuts } = await supabase
      .from("drive_files")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("is_shortcut", true)
      .eq("is_deleted", false);

    const targetOwner = session.role === "member" ? session.email : ownerParam || session.email;
    const { data: tok } = await supabase
      .from("google_oauth_tokens")
      .select("access_token")
      .eq("company_id", session.companyId)
      .eq("email", targetOwner)
      .maybeSingle();

    let googleLive: DriveListItem[] = [];
    if (tok?.access_token) {
      const drive = driveClient(tok.access_token);
      if (drive) {
        const listed = await drive.files.list({
          pageSize: 50,
          fields: "files(id,name,size,mimeType,owners,webViewLink)",
          q: "trashed=false",
        });
        googleLive = (listed.data.files || [])
          .filter((f) => f.id && f.name)
          .map((f) => ({
            id: f.id!,
            drive_file_id: f.id!,
            name: f.name!,
            owner_email: f.owners?.[0]?.emailAddress?.toLowerCase() || targetOwner,
            size: Number(f.size || 0),
            mime_type: f.mimeType,
            web_view_link: f.webViewLink,
            publicLink: null,
            source: "google",
          }));
      }
    }

    const fromDb = (shortcuts || []).map((f) => ({ ...mapRow(f), source: "google" as const }));
    const files = [...fromDb, ...googleLive];
    return { files: filterSearch(files, search), error: null };
  }

  if (!supabase) {
    let rows = [...DEMO_DRIVE_FILES];
    if (mode === "trash") rows = rows.filter((f) => (f as { is_deleted?: boolean }).is_deleted);
    else rows = rows.filter((f) => !(f as { is_deleted?: boolean }).is_deleted);
    if (mode === "bharatcloud" || mode === "vault" || mode === "my-uploads") {
      rows = rows.filter((f) => !f.is_shortcut);
    }
    if (mode === "shared") rows = rows.filter((f) => (f as { shared?: boolean }).shared);
    const companyVault = mode === "vault" && (saasRole === "company_owner" || saasRole === "employee");
    if (mode === "my-uploads" || (!companyVault && session.role === "member")) {
      rows = rows.filter((f) => f.owner_email === session.email);
    }
    const files = rows.map((f) => mapRow(f as Record<string, unknown>));
    return { files: filterSearch(files, search), error: null };
  }

  // Scope by company_id only — company_domain may be missing if migration 005/013 was not run.
  let query = supabase.from("drive_files").select("*").eq("company_id", session.companyId);

  if (mode === "trash") query = query.eq("is_deleted", true);
  else query = query.eq("is_deleted", false);

  if (mode === "bharatcloud") {
    query = query.eq("is_shortcut", false).eq("backup_status", "backedup");
  }
  if (mode === "vault" || mode === "my-uploads") {
    query = query.eq("is_shortcut", false);
  }
  if (mode === "shared") query = query.eq("shared", true);
  if (mode === "recent") query = query.order("created_at", { ascending: false }).limit(20);
  else query = query.order("created_at", { ascending: false });

  const companyVault = mode === "vault" && (saasRole === "company_owner" || saasRole === "employee");
  if (mode === "my-uploads") {
    query = query.eq("owner_email", session.email);
  } else if (companyVault) {
    /* all files in company_domain */
  } else if (session.role === "member" || saasRole === "employee") {
    query = query.eq("owner_email", session.email);
  } else if (ownerParam) {
    query = query.eq("owner_email", ownerParam);
  }

  let { data, error } = await query;

  if (
    error &&
    /is_deleted|created_at|company_domain|shared/.test(error.message)
  ) {
    let fallback = supabase
      .from("drive_files")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("is_shortcut", false);
    if (mode === "bharatcloud") {
      fallback = fallback.eq("backup_status", "backedup");
    }
    if (mode === "my-uploads" || session.role === "member" || saasRole === "employee") {
      fallback = fallback.eq("owner_email", session.email);
    } else if (ownerParam) {
      fallback = fallback.eq("owner_email", ownerParam);
    }
    const res = await fallback.order("name", { ascending: false });
    data = res.data;
    error = res.error;
  }

  if (error) {
    return { files: [], error: error.message };
  }

  let rows = data || [];
  if (mode === "trash") {
    rows = rows.filter((f) => Boolean((f as { is_deleted?: boolean }).is_deleted));
  } else {
    rows = rows.filter((f) => !(f as { is_deleted?: boolean }).is_deleted);
  }
  if (mode === "shared") {
    rows = rows.filter((f) => Boolean((f as { shared?: boolean }).shared));
  }

  const files = rows.map((f) => mapRow(f));
  return { files: filterSearch(files, search), error: null };
}

function filterSearch(files: DriveListItem[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return files;
  return files.filter(
    (f) => f.name.toLowerCase().includes(q) || f.owner_email.toLowerCase().includes(q),
  );
}

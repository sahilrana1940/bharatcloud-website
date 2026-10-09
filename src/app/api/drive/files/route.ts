import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const owner = url.searchParams.get("owner") || "";
  const source = url.searchParams.get("source") || "safe";

  const supabase = await getSupabaseOrNull();
  let files = DEMO_DRIVE_FILES;
  if (supabase) {
    let query = supabase
      .from("drive_files")
      .select("*")
      .eq("company_id", session.companyId);
    if (session.role === "member") {
      query = query.eq("owner_email", session.email);
    } else if (owner) {
      query = query.eq("owner_email", owner);
    }
    const { data } = await query;
    files = (data || []) as typeof DEMO_DRIVE_FILES;
  } else if (session.role === "member") {
    files = files.filter((f) => f.owner_email === session.email);
  } else if (owner) {
    files = files.filter((f) => f.owner_email === owner);
  }

  if (source === "google") {
    files = files.filter((f) => !f.is_shortcut);
  } else {
    files = files.filter((f) => f.backup_status === "backedup");
  }

  if (q) {
    files = files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.owner_email.toLowerCase().includes(q),
    );
  }

  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bharatcloud-backups`;

  const withLinks = files.map((f) => ({
    ...f,
    publicLink: f.s3_path && base ? `${base}/${f.s3_path}` : null,
  }));

  return NextResponse.json({ files: withLinks });
}

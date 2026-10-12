import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

const PAGE = 40;

export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const offset = (page - 1) * PAGE;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ items: [], page, hasMore: false });
  }

  const ownerView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  const email = session.email.toLowerCase();

  let jobIds: string[] | null = null;
  if (!ownerView) {
    const { data: jobs } = await supabase
      .from("company_backup_jobs")
      .select("id")
      .eq("company_id", session.companyId)
      .eq("owner_email", email);
    jobIds = (jobs || []).map((j) => j.id as string);
    if (!jobIds.length) {
      return NextResponse.json({ items: [], page, hasMore: false, driveBackupCount: 0 });
    }
  }

  let query = supabase
    .from("company_archive_files")
    .select("id, file_name, mime_type, compressed_size, archive_key, created_at, status, job_id", {
      count: "exact",
    })
    .eq("company_id", session.companyId)
    .eq("status", "archived")
    .not("archive_key", "is", null);

  if (jobIds) {
    query = query.in("job_id", jobIds);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE - 1);

  if (error) {
    if (error.message.includes("company_archive_files")) {
      return NextResponse.json({
        items: [],
        page,
        hasMore: false,
        migrationRequired: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((row) => ({
    id: row.id as string,
    file_name: row.file_name as string,
    mime_type: (row.mime_type as string) || null,
    size: Number(row.compressed_size || 0),
    created_at: row.created_at as string,
    source: "drive_backup" as const,
  }));

  const total = count ?? items.length;
  return NextResponse.json({
    items,
    page,
    hasMore: total > offset + PAGE,
    driveBackupCount: total,
  });
}

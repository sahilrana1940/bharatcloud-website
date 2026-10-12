import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const PAGE = 40;

/** Central company vault — all archived files for this company_id (any team member). */
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

  const { data, count, error } = await supabase
    .from("company_archive_files")
    .select(
      "id, file_name, mime_type, compressed_size, archive_key, created_at, status, source_owner_email",
      { count: "exact" },
    )
    .eq("company_id", session.companyId)
    .eq("status", "archived")
    .not("archive_key", "is", null)
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
    source_owner_email: (row.source_owner_email as string) || null,
    source: "drive_backup" as const,
  }));

  const total = count ?? items.length;
  return NextResponse.json({
    items,
    page,
    hasMore: total > offset + PAGE,
    driveBackupCount: total,
    centralVault: true,
  });
}

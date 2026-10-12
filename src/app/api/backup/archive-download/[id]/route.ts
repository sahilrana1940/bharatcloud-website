import { NextResponse } from "next/server";

import { presignedArchiveGetUrl } from "@/lib/s3/archive";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Not available" }, { status: 503 });
  }

  const { data: row, error } = await supabase
    .from("company_archive_files")
    .select("id, company_id, archive_key, job_id, file_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !row?.archive_key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.company_id !== session.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signedUrl = await presignedArchiveGetUrl(row.archive_key as string);
  if (!signedUrl) {
    return NextResponse.json({ error: "Download unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    signedUrl,
    fileName: row.file_name,
    expiresIn: 3600,
  });
}

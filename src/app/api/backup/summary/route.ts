import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      filesArchived: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      driveStatus: "idle",
      jobStatus: null,
    });
  }

  const { data: files, error: filesErr } = await supabase
    .from("company_archive_files")
    .select("original_size, compressed_size")
    .eq("company_id", session.companyId)
    .eq("status", "archived");

  if (filesErr?.message.includes("company_archive_files")) {
    return NextResponse.json({
      filesArchived: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      savedPct: 0,
      driveStatus: "idle",
      usedGb: 0,
      limitGb: 15,
      jobStatus: null,
      filesDone: 0,
      migrationRequired: true,
    });
  }

  let bytesOriginal = 0;
  let bytesCompressed = 0;
  for (const f of files || []) {
    bytesOriginal += Number(f.original_size || 0);
    bytesCompressed += Number(f.compressed_size || 0);
  }

  const { data: member } = await supabase
    .from("company_users")
    .select("drive_sync_status, drive_used_gb, drive_limit_gb")
    .eq("company_id", session.companyId)
    .eq("email", session.email.toLowerCase())
    .maybeSingle();

  const { data: job } = await supabase
    .from("company_backup_jobs")
    .select("status, files_done")
    .eq("company_id", session.companyId)
    .eq("owner_email", session.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const savedPct =
    bytesOriginal > 0
      ? Math.round((1 - bytesCompressed / bytesOriginal) * 100)
      : 0;

  return NextResponse.json({
    filesArchived: files?.length ?? 0,
    bytesOriginal,
    bytesCompressed,
    savedPct: Math.max(0, savedPct),
    driveStatus: member?.drive_sync_status || "idle",
    usedGb: Number(member?.drive_used_gb ?? bytesCompressed / 1024 ** 3),
    limitGb: Number(member?.drive_limit_gb ?? 15),
    jobStatus: job?.status ?? null,
    filesDone: job?.files_done ?? 0,
  });
}

import { NextResponse } from "next/server";

import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { fetchDriveAbout } from "@/lib/google/drive-api";
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

  const email = session.email.toLowerCase();
  const { data: myJobs } = await supabase
    .from("company_backup_jobs")
    .select("id")
    .eq("company_id", session.companyId)
    .eq("owner_email", email);
  const myJobIds = (myJobs || []).map((j) => j.id as string);

  const filesQuery = supabase
    .from("company_archive_files")
    .select("original_size, compressed_size, job_id")
    .eq("company_id", session.companyId)
    .eq("status", "archived");

  const { data: files, error: filesErr } = await filesQuery;
  const scopedFiles =
    myJobIds.length > 0
      ? (files || []).filter((f) => f.job_id && myJobIds.includes(f.job_id as string))
      : [];

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
  for (const f of scopedFiles) {
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

  const archiveUsedGb = Number(member?.drive_used_gb ?? bytesCompressed / 1024 ** 3);
  const productLimitGb = Number(member?.drive_limit_gb ?? 15);

  let googleDrive: {
    connected: boolean;
    usedGb: number;
    limitGb: number | null;
  } | null = null;

  try {
    const accessToken = await getValidGoogleAccessToken(
      supabase,
      session.companyId,
      session.email,
    );
    if (accessToken) {
      const { quota } = await fetchDriveAbout(accessToken);
      googleDrive = {
        connected: true,
        usedGb: quota.usedGb,
        limitGb: quota.limitGb,
      };
    }
  } catch (e) {
    console.warn("[backup/summary] drive.about.get failed:", e);
  }

  const sidebarUsedGb = googleDrive?.usedGb ?? archiveUsedGb;
  const sidebarLimitGb = googleDrive?.limitGb ?? productLimitGb;

  return NextResponse.json({
    filesArchived: scopedFiles.length,
    bytesOriginal,
    bytesCompressed,
    savedPct: Math.max(0, savedPct),
    driveStatus: member?.drive_sync_status || "idle",
    usedGb: sidebarUsedGb,
    limitGb: sidebarLimitGb ?? productLimitGb,
    archiveUsedGb,
    archiveLimitGb: productLimitGb,
    googleDrive,
    jobStatus: job?.status ?? null,
    filesDone: job?.files_done ?? 0,
  });
}

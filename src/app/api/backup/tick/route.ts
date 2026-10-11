import { NextResponse } from "next/server";

import { processBackupJobChunk } from "@/lib/backup/process-job-chunk";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;

  let jobId: string | undefined;
  try {
    const body = await req.json();
    jobId = body.jobId;
  } catch {
    jobId = undefined;
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!jobId) {
    const { data: job } = await supabase
      .from("company_backup_jobs")
      .select("id")
      .eq("company_id", auth.session.companyId)
      .eq("owner_email", auth.session.email.toLowerCase())
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    jobId = job?.id;
  }

  if (!jobId) {
    return NextResponse.json({ done: true, filesDone: 0 });
  }

  const result = await processBackupJobChunk(supabase, jobId);
  const { data: job } = await supabase
    .from("company_backup_jobs")
    .select("files_done, files_total, bytes_original, bytes_compressed, status")
    .eq("id", jobId)
    .maybeSingle();

  const bytesOriginal = Number((job as { bytes_original?: number })?.bytes_original ?? 0);
  const bytesCompressed = Number(job?.bytes_compressed ?? 0);
  const savedPct =
    bytesOriginal > 0
      ? Math.round((1 - bytesCompressed / bytesOriginal) * 100)
      : 0;

  return NextResponse.json({
    ok: true,
    jobId,
    done: result.done,
    filesDone: job?.files_done ?? result.filesDone,
    bytesOriginal,
    bytesCompressed,
    savedPct: Math.max(0, savedPct),
    status: job?.status,
    error: result.error,
  });
}

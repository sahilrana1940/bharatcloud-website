import { NextResponse } from "next/server";

import { logArchiveRestore } from "@/lib/archive/save-file-archive-row";
import { EMAIL_BACKUP_S3_BUCKET } from "@/lib/email/e2e-gmail-backup";
import { getArchiveObjectUrl } from "@/lib/s3/archive";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** POST — restore presigned URL from bharatcloudfinal2 archive + audit log. */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const runId = typeof body?.runId === "string" ? body.runId : "";
  const archiveId = typeof body?.archiveId === "string" ? body.archiveId : "";

  let s3Key = typeof body?.s3Key === "string" ? body.s3Key : "";
  let bucket = EMAIL_BACKUP_S3_BUCKET;
  let fileArchiveId: string | null = archiveId || null;

  if (archiveId) {
    const { data: row } = await supabase
      .from("file_archives")
      .select("*")
      .eq("id", archiveId)
      .eq("org_id", session.companyId)
      .maybeSingle();
    if (!row) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }
    s3Key = row.s3_key as string;
    bucket = (row.s3_bucket as string) || bucket;
    fileArchiveId = row.id as string;
  } else if (runId) {
    const { data: run, error } = await supabase
      .from("email_backup_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();

    if (error || !run) {
      return NextResponse.json({ error: "Archive run not found" }, { status: 404 });
    }

    if (
      run.user_email?.toLowerCase() !== session.email.toLowerCase() &&
      run.org_id !== session.companyId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    bucket = (run.s3_bucket as string) || bucket;
    const prefix = (run.s3_path as string) || "";

    const { data: first } = await supabase
      .from("file_archives")
      .select("id, s3_key")
      .eq("org_id", session.companyId)
      .like("s3_key", `${prefix}%`)
      .order("archived_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (first?.s3_key) {
      s3Key = first.s3_key as string;
      fileArchiveId = first.id as string;
    } else {
      s3Key = prefix.endsWith("/") ? `${prefix}sample.eml` : `${prefix}/sample.eml`;
    }
  }

  if (!s3Key) {
    return NextResponse.json({ error: "runId or archiveId required" }, { status: 400 });
  }

  const downloadUrl = await getArchiveObjectUrl(s3Key, bucket);

  await logArchiveRestore(supabase, {
    org_id: session.companyId,
    file_archive_id: fileArchiveId,
    s3_key: s3Key,
    restored_by: session.email,
  });

  return NextResponse.json({
    ok: true,
    message: "Restore link from E2E Mumbai archive (GLACIER class). Gmail originals unchanged.",
    bucket,
    s3Key,
    downloadUrl,
    hint: `Object: s3://${bucket}/${s3Key}`,
  });
}

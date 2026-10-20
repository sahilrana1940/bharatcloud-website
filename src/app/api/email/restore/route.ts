import { NextResponse } from "next/server";

import { presignedArchiveGetUrl } from "@/lib/s3/archive";
import { EMAIL_BACKUP_S3_BUCKET } from "@/lib/email/e2e-gmail-backup";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** POST — presigned download links for a completed backup run prefix. */
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
  if (!runId) {
    return NextResponse.json({ error: "runId required" }, { status: 400 });
  }

  const { data: run, error } = await supabase
    .from("email_backup_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error || !run) {
    return NextResponse.json({ error: "Backup run not found" }, { status: 404 });
  }

  if (
    run.user_email?.toLowerCase() !== session.email.toLowerCase() &&
    run.org_id !== session.companyId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prefix = (run.s3_path as string) || "";
  const sampleKey = prefix.endsWith("/")
    ? `${prefix}restore-manifest.txt`
    : `${prefix}/restore-manifest.txt`;

  const manifestUrl = await presignedArchiveGetUrl(sampleKey, 3600);

  return NextResponse.json({
    ok: true,
    message:
      "Restore from E2E Mumbai (.eml in your vault). Hostinger app + Paytm plan — contact support for bulk restore.",
    bucket: run.s3_bucket || EMAIL_BACKUP_S3_BUCKET,
    s3Path: prefix,
    emailCount: run.email_count,
    manifestUrl,
    hint: `Objects live under s3://${run.s3_bucket || EMAIL_BACKUP_S3_BUCKET}/${prefix}*.eml`,
  });
}

import { NextResponse } from "next/server";

import {
  countBackedUpEmails,
  listEmailBackupRuns,
  listFileArchives,
  orgArchiveStorageTotals,
  orgEmailBackupTotals,
  runE2eGmailBackup,
  EMAIL_BACKUP_S3_BUCKET,
} from "@/lib/email/e2e-gmail-backup";
import { archiveStorageClass } from "@/lib/storage/archiver-from-start";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export const maxDuration = 300;

/** GET — backup runs, progress, org totals for admins. */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      demo: true,
      bucket: EMAIL_BACKUP_S3_BUCKET,
      backedUpCount: 0,
      targetCount: 10000,
      runs: [],
    });
  }

  const url = new URL(req.url);
  const orgScope = url.searchParams.get("org") === "1";
  const owner = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  const { runs, tableMissing } = await listEmailBackupRuns(
    supabase,
    session.companyId,
    session.email,
  );

  const backedUpCount = await countBackedUpEmails(
    supabase,
    session.companyId,
    session.email,
  );

  let orgTotals = null;
  if (orgScope && owner) {
    orgTotals = await orgEmailBackupTotals(supabase, session.companyId);
  }

  const active = runs.find(
    (r) => (r as { status?: string }).status === "running",
  ) as { progress?: string; status?: string } | undefined;

  const { archives, tableMissing: archivesMissing } = await listFileArchives(
    supabase,
    session.companyId,
  );
  const storageTotals = await orgArchiveStorageTotals(supabase, session.companyId);

  return NextResponse.json({
    bucket: EMAIL_BACKUP_S3_BUCKET,
    storageClass: archiveStorageClass(),
    backedUpCount,
    targetCount: 10000,
    runs,
    archives,
    archivesMissing,
    totalArchiveGb: storageTotals.totalMb / 1024,
    tableMissing,
    progress: active?.progress || "",
    status: active?.status || "idle",
    orgTotals,
    fromStart: true,
    retentionYears: 7,
  });
}

/** POST — start Gmail → E2E .eml backup. */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let maxMessages = 100;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.maxMessages === "number") {
      maxMessages = body.maxMessages;
    }
  } catch {
    /* empty body ok */
  }

  const result = await runE2eGmailBackup(supabase, {
    companyId: session.companyId,
    email: session.email,
    maxMessages,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, runId: result.runId },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    runId: result.runId,
    emailCount: result.emailCount,
    sizeMb: result.sizeMb,
    bucket: EMAIL_BACKUP_S3_BUCKET,
    s3Path: result.s3Path,
    progress: `Archived ${result.emailCount} emails to ${EMAIL_BACKUP_S3_BUCKET}/${result.s3Path} (Gmail unchanged)`,
  });
}

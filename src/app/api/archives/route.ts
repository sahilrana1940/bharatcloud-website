import { NextResponse } from "next/server";

import {
  listFileArchives,
  orgArchiveStorageTotals,
  EMAIL_BACKUP_S3_BUCKET,
} from "@/lib/email/e2e-gmail-backup";
import { archiveStorageClass } from "@/lib/storage/archiver-from-start";
import { resolveMailboxScope } from "@/lib/archive/mailbox-scope";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** GET — file_archives for tenant (archiver from start). */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      demo: true,
      bucket: EMAIL_BACKUP_S3_BUCKET,
      storageClass: archiveStorageClass(),
      archives: [],
      totalGb: 0,
    });
  }

  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 50);

  const scope = await resolveMailboxScope(supabase, session.companyId, session.email);

  const { archives, tableMissing } = await listFileArchives(
    supabase,
    scope.companyId,
    limit,
    scope.email,
    scope.userId,
  );
  const totals = await orgArchiveStorageTotals(supabase, scope.companyId, scope.email, scope.userId);

  return NextResponse.json({
    bucket: EMAIL_BACKUP_S3_BUCKET,
    storageClass: archiveStorageClass(),
    archives,
    tableMissing,
    totalGb: totals.totalMb / 1024,
    totalMb: totals.totalMb,
    fileCount: totals.fileCount,
    fromStart: true,
    retentionYears: 7,
  });
}

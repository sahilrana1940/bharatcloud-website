import { NextResponse } from "next/server";

import { runE2eGmailBackupBatch } from "@/lib/email/e2e-gmail-backup-route-handler";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** POST — archive up to one batch of Gmail messages to E2E (client loops until continue=false). */
export async function POST(req: Request) {
  try {
    const auth = await requireWorkspace();
    if (auth instanceof NextResponse) {
      return NextResponse.json(
        { archived: 0, total: 0, continue: false, error: "Unauthorized" },
        { status: 200 },
      );
    }
    const { session } = auth;

    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      return NextResponse.json(
        { archived: 0, total: 0, continue: false, error: "Database not configured" },
        { status: 200 },
      );
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const result = await runE2eGmailBackupBatch(supabase, session, body);
    return NextResponse.json(
      {
        archived: result.archived,
        total: result.total,
        continue: result.archived < result.total,
        nextPageToken: result.nextPageToken ?? null,
        batchUploaded: result.batchUploaded ?? 0,
        error: result.error ?? null,
      },
      { status: 200 },
    );
  } catch (e) {
    const err = e instanceof Error ? e.message : "Archive batch failed";
    console.error(err);
    return NextResponse.json(
      {
        archived: 0,
        total: 0,
        continue: false,
        nextPageToken: null,
        batchUploaded: 0,
        error: err,
      },
      { status: 200 },
    );
  }
}

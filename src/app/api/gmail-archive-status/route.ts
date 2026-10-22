import { NextResponse } from "next/server";

import { getGmailArchiveStatus } from "@/lib/email/gmail-archive-status";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** GET — lightweight progress for background Gmail archive polling. */
export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const status = await getGmailArchiveStatus(supabase, session);
  return NextResponse.json(status);
}

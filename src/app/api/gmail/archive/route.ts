import { NextResponse } from "next/server";

import { handleGmailArchivePost } from "@/lib/email/gmail-archive-api";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST — up to 50 × 5 = 250 Gmail .eml archives per click (E2E). */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  return handleGmailArchivePost(req, supabase, session);
}

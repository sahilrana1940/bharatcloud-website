import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Drop stored Gmail tokens so the mailbox can be connected again. */
export async function POST() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const email = session.email.toLowerCase();
  await supabase.from("google_oauth_tokens").delete().eq("email", email);

  return NextResponse.json({ ok: true });
}

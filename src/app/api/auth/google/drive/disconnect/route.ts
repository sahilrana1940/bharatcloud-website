import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  await supabase
    .from("google_oauth_tokens")
    .delete()
    .eq("company_id", session.companyId)
    .eq("email", session.email.toLowerCase());

  return NextResponse.json({ ok: true });
}

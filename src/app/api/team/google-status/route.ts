import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ connected: false, demo: true });
  }

  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("refresh_token, access_token, expiry")
    .eq("company_id", session.companyId)
    .eq("email", session.email.toLowerCase())
    .maybeSingle();

  const connected = Boolean(
    data?.refresh_token || data?.access_token,
  );

  return NextResponse.json({
    connected,
    email: session.email,
    oauthConfigured: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
  });
}

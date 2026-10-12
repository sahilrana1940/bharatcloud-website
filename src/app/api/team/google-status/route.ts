import { NextResponse } from "next/server";

import { getGoogleOAuthConfig } from "@/lib/google/config";
import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
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

  const row = await fetchGoogleTokenRowForWorkspace(
    supabase,
    session.companyId,
    session.email,
  );
  const { clientId, clientSecret } = getGoogleOAuthConfig();

  return NextResponse.json({
    connected: isGoogleTokenRowConnected(row),
    email: session.email,
    googleEmail: row?.google_email || null,
    oauthConfigured: Boolean(clientId && clientSecret),
    settingsUrl: "/settings",
  });
}

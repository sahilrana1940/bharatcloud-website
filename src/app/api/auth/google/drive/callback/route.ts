import { NextResponse } from "next/server";

import { emailDomain } from "@/lib/google/client";
import { createGoogleDriveOAuth2Client } from "@/lib/google/drive-oauth";
import { verifyGoogleOAuthState } from "@/lib/google/oauth-state";
import { saveGoogleOAuthTokens } from "@/lib/google/save-tokens";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/settings?drive=error&reason=${encodeURIComponent(oauthError)}`, url.origin),
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const linkState = verifyGoogleOAuthState(stateRaw);
  if (!linkState) {
    return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
  }

  const oauth2 = createGoogleDriveOAuth2Client();
  if (!oauth2) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  const ticket = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
  );
  const profile = await ticket.json();
  const googleEmail = String(profile.email || "").toLowerCase();
  if (!googleEmail || !emailDomain(googleEmail)) {
    return NextResponse.json({ error: "Invalid Google profile" }, { status: 400 });
  }

  if (googleEmail !== linkState.email) {
    return NextResponse.redirect(
      new URL(
        `/settings?drive=error&reason=${encodeURIComponent(
          `Use Google account ${linkState.email}`,
        )}`,
        url.origin,
      ),
    );
  }

  await saveGoogleOAuthTokens(supabase, {
    companyId: linkState.companyId,
    email: linkState.email,
    googleEmail,
    tokens,
  });

  const redirectTo = linkState.returnTo.startsWith("/")
    ? linkState.returnTo
    : "/settings?drive=connected";

  const dest = new URL(redirectTo, url.origin);
  if (!dest.searchParams.has("drive")) {
    dest.searchParams.set("drive", "connected");
  }

  return NextResponse.redirect(dest);
}

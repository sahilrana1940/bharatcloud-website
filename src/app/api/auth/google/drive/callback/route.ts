import { NextResponse } from "next/server";

import { createGoogleDriveOAuth2Client } from "@/lib/google/drive-oauth";
import {
  exchangeOAuthCode,
  oauthCallbackRedirectUri,
  resolveGoogleAccountEmail,
} from "@/lib/google/oauth-callback";
import { verifyGoogleOAuthState } from "@/lib/google/oauth-state";
import { saveGoogleOAuthTokens } from "@/lib/google/save-tokens";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import {
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  workspaceCookieOptions,
} from "@/lib/workspace/session";
import { touchProfileLogin } from "@/lib/workspace/workspace-profiles";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    let returnTo = "/settings";
    if (stateRaw) {
      const st = verifyGoogleOAuthState(stateRaw);
      if (st?.returnTo?.startsWith("/")) returnTo = st.returnTo;
    }
    const errDest = new URL(returnTo, url.origin);
    errDest.searchParams.set("drive", "error");
    errDest.searchParams.set("reason", oauthError);
    return NextResponse.redirect(errDest);
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

  const redirectUri = oauthCallbackRedirectUri(req);
  let tokens;
  try {
    const exchanged = await exchangeOAuthCode(oauth2, code, redirectUri);
    tokens = exchanged.tokens;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    const errDest = new URL(
      linkState.returnTo.startsWith("/") ? linkState.returnTo : "/settings",
      url.origin,
    );
    errDest.searchParams.set("drive", "error");
    errDest.searchParams.set(
      "reason",
      `OAuth token error — set GOOGLE_REDIRECT_URI to ${redirectUri}. ${msg}`,
    );
    return NextResponse.redirect(errDest);
  }

  const resolved = await resolveGoogleAccountEmail(oauth2, tokens);
  if ("error" in resolved) {
    const errDest = new URL(
      linkState.returnTo.startsWith("/") ? linkState.returnTo : "/settings",
      url.origin,
    );
    errDest.searchParams.set("drive", "error");
    errDest.searchParams.set("reason", resolved.error);
    return NextResponse.redirect(errDest);
  }
  const googleEmail = resolved.email;

  if (googleEmail !== linkState.email) {
    const mismatch = new URL(
      linkState.returnTo.startsWith("/") ? linkState.returnTo : "/settings",
      url.origin,
    );
    mismatch.searchParams.set("drive", "error");
    mismatch.searchParams.set(
      "reason",
      `Use Google account ${linkState.email}`,
    );
    return NextResponse.redirect(mismatch);
  }

  await saveGoogleOAuthTokens(supabase, {
    companyId: linkState.companyId,
    email: linkState.email,
    googleEmail,
    tokens,
  });
  await touchProfileLogin(supabase, linkState.email, linkState.companyId);

  const redirectTo = linkState.returnTo.startsWith("/")
    ? linkState.returnTo
    : "/settings?drive=connected";

  const dest = new URL(redirectTo, url.origin);
  if (!dest.searchParams.has("drive")) {
    dest.searchParams.set("drive", "connected");
  }

  const res = NextResponse.redirect(dest);
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, linkState.companyId, opts);
  res.cookies.set(WS_EMAIL_COOKIE, linkState.email.toLowerCase(), opts);
  return res;
}

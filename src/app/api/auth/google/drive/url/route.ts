import { NextResponse } from "next/server";

import {
  createGoogleDriveOAuth2Client,
  GOOGLE_DRIVE_OAUTH_SCOPES,
} from "@/lib/google/drive-oauth";
import { signGoogleOAuthState } from "@/lib/google/oauth-state";
import { requireWorkspace } from "@/lib/workspace/auth-api";

/** Returns Google OAuth URL for 1-click Drive connect (settings / integrations). */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const oauth2 = createGoogleDriveOAuth2Client();
  if (!oauth2) {
    return NextResponse.json(
      { error: "Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/settings?drive=connected";
  const includeGmail = url.searchParams.get("gmail") === "1";

  const scopes = GOOGLE_DRIVE_OAUTH_SCOPES.split(" ");
  if (includeGmail) {
    scopes.push("https://www.googleapis.com/auth/gmail.readonly");
  }

  const state = signGoogleOAuthState({
    companyId: session.companyId,
    email: session.email.toLowerCase(),
    returnTo,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
    login_hint: session.email,
  });

  return NextResponse.json({ url: authUrl });
}

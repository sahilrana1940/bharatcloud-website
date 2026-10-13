import { NextResponse } from "next/server";

import {
  createGoogleDriveOAuth2Client,
  googleDriveOAuthScopeList,
} from "@/lib/google/drive-oauth";
import { signGoogleOAuthState } from "@/lib/google/oauth-state";
import { checkGoogleConnectAllowed } from "@/lib/integrations/google-connect-approval";
import { requireWorkspace } from "@/lib/workspace/auth-api";

/** Returns Google OAuth URL for 1-click Drive connect (settings / integrations). */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const gate = await checkGoogleConnectAllowed(session.email, session.companyId);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.message, googleConnectStatus: gate.status }, { status: 403 });
  }

  const oauth2 = createGoogleDriveOAuth2Client();
  if (!oauth2) {
    return NextResponse.json(
      { error: "Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/settings?drive=connected";
  const includeGmail = url.searchParams.get("gmail") !== "0";

  const scopes = googleDriveOAuthScopeList(includeGmail);

  const state = signGoogleOAuthState({
    companyId: session.companyId,
    email: session.email.toLowerCase(),
    returnTo,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
    state,
    login_hint: session.email,
  });

  return NextResponse.json({ url: authUrl });
}

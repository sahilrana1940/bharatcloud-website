import { NextResponse } from "next/server";

import { createOAuth2Client } from "@/lib/google/client";
import { GOOGLE_SCOPES } from "@/lib/google/config";
import { signGoogleOAuthState } from "@/lib/google/oauth-state";
import { requireWorkspace } from "@/lib/workspace/auth-api";

/** Link Google Drive to the current workspace session (password login → OAuth). */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/dashboard/team";

  const oauth2 = createOAuth2Client();
  if (!oauth2) {
    return NextResponse.json(
      {
        error: "Google OAuth not configured on server",
        hint:
          "Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in Vercel, then redeploy.",
      },
      { status: 503 },
    );
  }

  const state = signGoogleOAuthState({
    companyId: session.companyId,
    email: session.email.toLowerCase(),
    returnTo,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: GOOGLE_SCOPES.split(" "),
    state,
    login_hint: session.email,
  });

  return NextResponse.redirect(authUrl);
}

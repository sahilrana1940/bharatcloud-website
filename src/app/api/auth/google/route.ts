import { NextResponse } from "next/server";

import { createOAuth2Client } from "@/lib/google/client";
import { resolveGoogleOAuthScopeList } from "@/lib/google/config";

export async function GET(req: Request) {
  const oauth2 = createOAuth2Client(req);
  if (!oauth2) {
    return NextResponse.json(
      {
        error: "Google OAuth not configured",
        demoLoginUrl: "/api/auth/google/demo",
      },
      { status: 503 },
    );
  }

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: resolveGoogleOAuthScopeList({ includeGmail: true }),
  });
  return NextResponse.redirect(url);
}

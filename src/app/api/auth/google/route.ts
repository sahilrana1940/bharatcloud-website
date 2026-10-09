import { NextResponse } from "next/server";

import { createOAuth2Client } from "@/lib/google/client";
import { GOOGLE_SCOPES } from "@/lib/google/config";

export async function GET() {
  const oauth2 = createOAuth2Client();
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
    scope: GOOGLE_SCOPES.split(" "),
  });
  return NextResponse.redirect(url);
}

import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { emailDomain } from "@/lib/google/client";

/** Redirect URI must match the callback URL Google hit (path + host), not only env default. */
export function oauthCallbackRedirectUri(req: Request): string {
  const url = new URL(req.url);
  return `${url.origin}${url.pathname}`;
}

export async function exchangeOAuthCode(
  oauth2: OAuth2Client,
  code: string,
  redirectUri: string,
) {
  return oauth2.getToken({ code, redirect_uri: redirectUri });
}

function emailFromIdToken(idToken: string | null | undefined): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { email?: string };
    const email = payload.email?.trim().toLowerCase();
    return email && email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

/** Resolve signed-in Google account email after token exchange. */
export async function resolveGoogleAccountEmail(
  oauth2: OAuth2Client,
  tokens: { access_token?: string | null; id_token?: string | null },
): Promise<{ email: string } | { error: string }> {
  const fromId = emailFromIdToken(tokens.id_token);
  if (fromId) return { email: fromId };

  if (!tokens.access_token) {
    return {
      error:
        "Google did not return an access token — check GOOGLE_REDIRECT_URI matches this callback URL exactly.",
    };
  }

  oauth2.setCredentials(tokens);

  try {
    const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
    const { data } = await oauth2Api.userinfo.get();
    const email = data.email?.trim().toLowerCase();
    if (email && emailDomain(email)) return { email };
  } catch {
    /* try Gmail / Drive profile next */
  }

  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2 });
    const { data } = await gmail.users.getProfile({ userId: "me" });
    const email = data.emailAddress?.trim().toLowerCase();
    if (email && emailDomain(email)) return { email };
  } catch {
    /* drive about next */
  }

  try {
    const drive = google.drive({ version: "v3", auth: oauth2 });
    const { data } = await drive.about.get({ fields: "user" });
    const email = data.user?.emailAddress?.trim().toLowerCase();
    if (email && emailDomain(email)) return { email };
  } catch {
    /* fall through */
  }

  return {
    error:
      "Could not read your Google work email. Sign in with the same address you use on BharatCloud (e.g. sunderbanihub@gorjrmcourier.com), allow all permissions, or remove GOOGLE_SCOPES on Vercel and redeploy.",
  };
}

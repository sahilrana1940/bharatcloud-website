import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { emailDomain } from "@/lib/google/client";
import { getGoogleOAuthConfig } from "@/lib/google/config";
import { getGoogleDriveOAuthRedirectUri } from "@/lib/google/drive-oauth";

/** Request URL (fallback when env redirect is not set). */
export function oauthCallbackRedirectUri(req: Request): string {
  const url = new URL(req.url);
  return `${url.origin}${url.pathname}`;
}

/**
 * Must match `generateAuthUrl` redirect_uri exactly (same as GOOGLE_REDIRECT_URI).
 * Using the request host here causes redirect_uri_mismatch when www vs apex differ.
 */
export function oauthRedirectUriForDriveExchange(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI?.trim()) {
    return getGoogleDriveOAuthRedirectUri();
  }
  return oauthCallbackRedirectUri(req);
}

export function oauthRedirectUriForWorkspaceExchange(req: Request): string {
  const { redirectUri } = getGoogleOAuthConfig();
  if (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  ) {
    return redirectUri;
  }
  return oauthCallbackRedirectUri(req);
}

export function formatOAuthRedirectMismatchHint(registeredUri: string): string {
  const alt = registeredUri.includes("://www.")
    ? registeredUri.replace("://www.", "://")
    : registeredUri.replace("://", "://www.");
  return (
    `redirect_uri_mismatch — set Vercel GOOGLE_REDIRECT_URI to exactly: ${registeredUri}. ` +
    `In Google Cloud Console add BOTH Authorized redirect URIs if needed: ${registeredUri} and ${alt}`
  );
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
      "Could not read your Google work email. Sign in with the same address you use on BharatCloud, allow all permissions, or remove GOOGLE_SCOPES on Vercel and redeploy.",
  };
}

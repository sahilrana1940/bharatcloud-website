import { google } from "googleapis";

import { getGoogleOAuthConfig } from "@/lib/google/config";

export const GOOGLE_DRIVE_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

/** Gmail archive (employee My mail) — requested with Drive on workspace connect. */
export const GMAIL_READONLY_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_METADATA_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/gmail.metadata";

export const GMAIL_WORKSPACE_OAUTH_SCOPES = [
  GMAIL_READONLY_OAUTH_SCOPE,
  GMAIL_METADATA_OAUTH_SCOPE,
];

export const GOOGLE_DRIVE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_DRIVE_OAUTH_SCOPE,
  ...GMAIL_WORKSPACE_OAUTH_SCOPES,
].join(" ");

export function googleDriveOAuthScopeList(includeGmail = true): string[] {
  const base = GOOGLE_DRIVE_OAUTH_SCOPES.split(" ").filter(Boolean);
  if (includeGmail) return base;
  return base.filter((s) => !GMAIL_WORKSPACE_OAUTH_SCOPES.includes(s));
}

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Redirect URI for 1-click Drive OAuth (`GOOGLE_REDIRECT_URI` or default drive callback). */
export function getGoogleDriveOAuthRedirectUri(): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return `${appOrigin()}/api/auth/google/drive/callback`;
}

export function createGoogleDriveOAuth2Client() {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, getGoogleDriveOAuthRedirectUri());
}

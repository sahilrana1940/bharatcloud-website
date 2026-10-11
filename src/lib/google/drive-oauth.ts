import { google } from "googleapis";

import { getGoogleOAuthConfig } from "@/lib/google/config";

export const GOOGLE_DRIVE_OAUTH_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const GOOGLE_DRIVE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_DRIVE_OAUTH_SCOPE,
].join(" ");

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

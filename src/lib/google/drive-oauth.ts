import { google } from "googleapis";

import {
  getGoogleOAuthConfig,
  normalizeGoogleEnvValue,
  resolveGoogleOAuthScopeList,
} from "@/lib/google/config";
import { isLocalUrl, publicUrl } from "@/lib/http/public-url";

export const GOOGLE_DRIVE_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/drive.readonly";

export const GMAIL_READONLY_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_METADATA_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/gmail.metadata";

export const GMAIL_WORKSPACE_OAUTH_SCOPES = [
  GMAIL_READONLY_OAUTH_SCOPE,
  GMAIL_METADATA_OAUTH_SCOPE,
];

/** Workspace Settings / employee mail OAuth scope list. */
export function googleDriveOAuthScopeList(includeGmail = true): string[] {
  return resolveGoogleOAuthScopeList({ includeGmail });
}

/** Redirect URI for 1-click Drive OAuth (`GOOGLE_REDIRECT_URI` or the current site). */
export function getGoogleDriveOAuthRedirectUri(req?: Request): string {
  const fromEnv = normalizeGoogleEnvValue(process.env.GOOGLE_REDIRECT_URI);
  if (fromEnv && !isLocalUrl(fromEnv)) return fromEnv;
  return publicUrl("/api/auth/google/drive/callback", req);
}

export function createGoogleDriveOAuth2Client(req?: Request) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, getGoogleDriveOAuthRedirectUri(req));
}

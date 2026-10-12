import { isEmailBackupEnabled } from "@/lib/feature-flags";

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Team login / full backup OAuth (separate redirect from Drive settings flow). */
export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const driveRedirect = process.env.GOOGLE_REDIRECT_URI?.trim() || "";
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    (driveRedirect.includes("/drive/callback")
      ? `${appOrigin()}/api/auth/google/callback`
      : driveRedirect || `${appOrigin()}/api/auth/google/callback`);

  return { clientId, clientSecret, redirectUri };
}

const GMAIL_SCOPE_URLS = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
];

const DEFAULT_DRIVE_SCOPES = [
  "openid",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive.readonly",
];

/**
 * OAuth scopes — override in Vercel with space-separated GOOGLE_SCOPES.
 * Example:
 * GOOGLE_SCOPES=https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly ...
 */
export function resolveGoogleOAuthScopeList(opts?: {
  includeGmail?: boolean;
}): string[] {
  const fromEnv = process.env.GOOGLE_SCOPES?.trim();
  if (fromEnv) {
    return fromEnv.split(/\s+/).filter(Boolean);
  }

  const includeGmail = opts?.includeGmail ?? true;
  const scopes = [...DEFAULT_DRIVE_SCOPES];
  if (includeGmail) scopes.push(...GMAIL_SCOPE_URLS);
  return scopes;
}

export function getGoogleOAuthScopesString(opts?: { includeGmail?: boolean }): string {
  return resolveGoogleOAuthScopeList(opts).join(" ");
}

/** @deprecated Prefer resolveGoogleOAuthScopeList() at request time (reads GOOGLE_SCOPES env). */
export const GOOGLE_SCOPES = getGoogleOAuthScopesString({
  includeGmail: isEmailBackupEnabled(),
});

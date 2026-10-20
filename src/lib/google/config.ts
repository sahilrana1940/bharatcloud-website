import { isEmailBackupEnabled } from "@/lib/feature-flags";

function appOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Google rejects client ids that differ by whitespace. A trailing newline in
 * GOOGLE_CLIENT_ID is sent as `%0A` and Google returns `invalid_client`.
 * Also drop one layer of wrapping quotes and a trailing literal `\n` / `\r`.
 */
export function normalizeGoogleEnvValue(value: string | undefined): string {
  let v = (value ?? "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\\n$/g, "").replace(/\\r$/g, "").trim();
}

/** Team login / full backup OAuth (separate redirect from Drive settings flow). */
export function getGoogleOAuthConfig() {
  const clientId = normalizeGoogleEnvValue(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = normalizeGoogleEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const driveRedirect = normalizeGoogleEnvValue(process.env.GOOGLE_REDIRECT_URI);
  const redirectUri =
    normalizeGoogleEnvValue(process.env.GOOGLE_OAUTH_REDIRECT_URI) ||
    (driveRedirect.includes("/drive/callback")
      ? `${appOrigin()}/api/auth/google/callback`
      : driveRedirect || `${appOrigin()}/api/auth/google/callback`);

  return { clientId, clientSecret, redirectUri };
}

const GMAIL_SCOPE_URLS = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.metadata",
];

/** Always requested — needed for id_token email + userinfo (even when GOOGLE_SCOPES env is set). */
const REQUIRED_OAUTH_SCOPES = [
  "openid",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const DEFAULT_DRIVE_SCOPES = [
  ...REQUIRED_OAUTH_SCOPES,
  "https://www.googleapis.com/auth/drive.readonly",
];

/** Google rejects bare `/auth/drive` and `/auth/gmail` — map common misconfigurations. */
const GOOGLE_SCOPE_ALIASES: Record<string, string> = {
  "https://www.googleapis.com/auth/drive": "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail": "https://www.googleapis.com/auth/gmail.readonly",
  drive: "https://www.googleapis.com/auth/drive.readonly",
  gmail: "https://www.googleapis.com/auth/gmail.readonly",
};

function parseGoogleScopesEnv(raw: string): string[] {
  const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const mapped = GOOGLE_SCOPE_ALIASES[part] || part;
    if (mapped.startsWith("https://www.googleapis.com/auth/") || mapped === "openid" || mapped === "profile") {
      out.push(mapped);
    }
  }
  return [...new Set(out)];
}

function withRequiredScopes(scopes: string[]): string[] {
  return [...new Set([...REQUIRED_OAUTH_SCOPES, ...scopes])];
}

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
    const parsed = parseGoogleScopesEnv(fromEnv);
    if (parsed.length) return withRequiredScopes(parsed);
  }

  const includeGmail = opts?.includeGmail ?? true;
  const scopes = [...DEFAULT_DRIVE_SCOPES];
  if (includeGmail) scopes.push(...GMAIL_SCOPE_URLS);
  return withRequiredScopes(scopes);
}

export function getGoogleOAuthScopesString(opts?: { includeGmail?: boolean }): string {
  return resolveGoogleOAuthScopeList(opts).join(" ");
}

/** @deprecated Prefer resolveGoogleOAuthScopeList() at request time (reads GOOGLE_SCOPES env). */
export const GOOGLE_SCOPES = getGoogleOAuthScopesString({
  includeGmail: isEmailBackupEnabled(),
});

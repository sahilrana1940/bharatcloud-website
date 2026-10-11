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

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
].join(" ");

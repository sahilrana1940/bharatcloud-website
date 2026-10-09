import { google } from "googleapis";

import { getGoogleOAuthConfig } from "@/lib/google/config";

export function createOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function driveClient(accessToken: string) {
  const oauth2 = createOAuth2Client();
  if (!oauth2) return null;
  oauth2.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2 });
}

export function gmailClient(accessToken: string) {
  const oauth2 = createOAuth2Client();
  if (!oauth2) return null;
  oauth2.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export function adminClient(accessToken: string) {
  const oauth2 = createOAuth2Client();
  if (!oauth2) return null;
  oauth2.setCredentials({ access_token: accessToken });
  return google.admin({ version: "directory_v1", auth: oauth2 });
}

export function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "";
}

import type { SupabaseClient } from "@supabase/supabase-js";

import { encryptSecret } from "@/lib/crypto/encryption";
import { createOAuth2Client } from "@/lib/google/client";
import { fetchGoogleTokenRowForWorkspace } from "@/lib/google/token-row";

export async function getValidGoogleAccessToken(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
  opts?: { force?: boolean },
): Promise<string | null> {
  const data = await fetchGoogleTokenRowForWorkspace(supabase, companyId, email);

  if (!data?.access_token && !data?.refresh_token) return null;

  const expiry = data.expiry ? new Date(data.expiry).getTime() : 0;
  const stillValid = expiry > Date.now() + 60_000;
  if (!opts?.force && stillValid && data.access_token) return data.access_token;

  if (!data.refresh_token) return data.access_token || null;

  const oauth2 = createOAuth2Client();
  if (!oauth2) return data.access_token || null;

  oauth2.setCredentials({ refresh_token: data.refresh_token });
  let credentials;
  try {
    const refreshed = await oauth2.refreshAccessToken();
    credentials = refreshed.credentials;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail token refresh failed";
    console.log("[gmail] token refresh failed", JSON.stringify({ message }));
    if (/invalid_grant|expired|revoked|unauthorized/i.test(message)) {
      throw new Error("Gmail access expired. Reconnect Gmail.");
    }
    throw err;
  }
  const access = credentials.access_token;
  if (!access) return null;

  const tokenCompanyId = data.company_id || companyId;
  await supabase
    .from("google_oauth_tokens")
    .update({
      access_token: encryptSecret(access),
      expiry: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    })
    .eq("company_id", tokenCompanyId)
    .eq("email", email.toLowerCase());

  return access;
}

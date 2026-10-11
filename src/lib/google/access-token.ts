import type { SupabaseClient } from "@supabase/supabase-js";

import { createOAuth2Client } from "@/lib/google/client";

export async function getValidGoogleAccessToken(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expiry")
    .eq("company_id", companyId)
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data?.access_token && !data?.refresh_token) return null;

  const expiry = data.expiry ? new Date(data.expiry as string).getTime() : 0;
  const stillValid = expiry > Date.now() + 60_000;
  if (stillValid && data.access_token) return data.access_token as string;

  if (!data.refresh_token) return (data.access_token as string) || null;

  const oauth2 = createOAuth2Client();
  if (!oauth2) return (data.access_token as string) || null;

  oauth2.setCredentials({ refresh_token: data.refresh_token as string });
  const { credentials } = await oauth2.refreshAccessToken();
  const access = credentials.access_token;
  if (!access) return null;

  await supabase
    .from("google_oauth_tokens")
    .update({
      access_token: access,
      expiry: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    })
    .eq("company_id", companyId)
    .eq("email", email.toLowerCase());

  return access;
}

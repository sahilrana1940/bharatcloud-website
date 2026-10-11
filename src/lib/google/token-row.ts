import type { SupabaseClient } from "@supabase/supabase-js";

import {
  decryptSecret,
  hasEncryptedOrPlainToken,
} from "@/lib/crypto/encryption";

export type GoogleTokenRow = {
  access_token: string | null;
  refresh_token: string | null;
  expiry: string | null;
  google_email: string | null;
};

export async function fetchGoogleTokenRow(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<GoogleTokenRow | null> {
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expiry, google_email")
    .eq("company_id", companyId)
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data) return null;
  return {
    access_token: decryptSecret(data.access_token as string | null),
    refresh_token: decryptSecret(data.refresh_token as string | null),
    expiry: (data.expiry as string) || null,
    google_email: (data.google_email as string) || null,
  };
}

export function isGoogleTokenRowConnected(row: GoogleTokenRow | null): boolean {
  if (!row) return false;
  return hasEncryptedOrPlainToken(row.refresh_token) || hasEncryptedOrPlainToken(row.access_token);
}

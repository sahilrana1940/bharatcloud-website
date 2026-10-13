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
  company_id?: string | null;
};

export async function fetchGoogleTokenRow(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<GoogleTokenRow | null> {
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expiry, google_email, company_id")
    .eq("company_id", companyId)
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data) return null;
  return {
    access_token: decryptSecret(data.access_token as string | null),
    refresh_token: decryptSecret(data.refresh_token as string | null),
    expiry: (data.expiry as string) || null,
    google_email: (data.google_email as string) || null,
    company_id: (data.company_id as string) || null,
  };
}

export function isGoogleTokenRowConnected(row: GoogleTokenRow | null): boolean {
  if (!row) return false;
  return hasEncryptedOrPlainToken(row.refresh_token) || hasEncryptedOrPlainToken(row.access_token);
}

/** Resolve tokens when `bc_workspace_company` cookie does not match token row company_id. */
export async function fetchGoogleTokenRowForWorkspace(
  supabase: SupabaseClient,
  companyId: string,
  email: string,
): Promise<GoogleTokenRow | null> {
  const normalized = email.toLowerCase();
  const primary = await fetchGoogleTokenRow(supabase, companyId, normalized);
  if (isGoogleTokenRowConnected(primary)) return primary;

  const { data: rows } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, expiry, google_email, company_id")
    .eq("email", normalized)
    .order("expiry", { ascending: false, nullsFirst: true })
    .limit(5);

  for (const data of rows || []) {
    const row: GoogleTokenRow = {
      access_token: decryptSecret(data.access_token as string | null),
      refresh_token: decryptSecret(data.refresh_token as string | null),
      expiry: (data.expiry as string) || null,
      google_email: (data.google_email as string) || null,
      company_id: (data.company_id as string) || null,
    };
    if (isGoogleTokenRowConnected(row)) return row;
  }

  return primary;
}

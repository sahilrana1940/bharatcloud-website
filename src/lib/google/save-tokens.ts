import type { SupabaseClient } from "@supabase/supabase-js";
import type { Credentials } from "google-auth-library";

export async function saveGoogleOAuthTokens(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    email: string;
    tokens: Credentials;
  },
) {
  const email = opts.email.toLowerCase();
  const { access_token, refresh_token, expiry_date } = opts.tokens;
  await supabase.from("google_oauth_tokens").upsert({
    company_id: opts.companyId,
    email,
    access_token,
    refresh_token,
    expiry: expiry_date ? new Date(expiry_date).toISOString() : null,
  });

  await supabase
    .from("company_users")
    .update({ is_backup_enabled: true })
    .eq("company_id", opts.companyId)
    .eq("email", email);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Credentials } from "google-auth-library";

import { encryptSecret } from "@/lib/crypto/encryption";

export async function saveGoogleOAuthTokens(
  supabase: SupabaseClient,
  opts: {
    companyId: string;
    email: string;
    tokens: Credentials;
    googleEmail?: string;
  },
) {
  const email = opts.email.toLowerCase();
  const googleEmail = (opts.googleEmail || email).toLowerCase();
  const { access_token, refresh_token, expiry_date } = opts.tokens;
  await supabase.from("google_oauth_tokens").upsert({
    company_id: opts.companyId,
    email,
    google_email: googleEmail,
    access_token: encryptSecret(access_token ?? null),
    refresh_token: encryptSecret(refresh_token ?? null),
    expiry: expiry_date ? new Date(expiry_date).toISOString() : null,
  });

  await supabase
    .from("company_users")
    .update({ is_backup_enabled: true })
    .eq("company_id", opts.companyId)
    .eq("email", email);
}

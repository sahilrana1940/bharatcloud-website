/** True when the JWT is Supabase service_role (bypasses RLS). */
export function isServiceRoleKey(key: string): boolean {
  try {
    const part = key.split(".")[1];
    if (!part) return false;
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as {
      role?: string;
    };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function serviceRoleConfigHint(): string {
  return (
    "Vercel → Settings → Environment Variables: set SUPABASE_SERVICE_ROLE_KEY to the " +
    "service_role secret from Supabase (Dashboard → Project Settings → API). " +
    "Enable it for Production and Preview, then Redeploy. Do not use the anon/public key here."
  );
}

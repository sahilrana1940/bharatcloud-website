import crypto from "crypto";

export type GoogleOAuthState = {
  companyId: string;
  email: string;
  returnTo: string;
  startBackupAfter?: boolean;
};

function secret() {
  return process.env.BC_PIN_SALT || process.env.CRON_SECRET || "bharatcloud-oauth-dev";
}

export function signGoogleOAuthState(payload: GoogleOAuthState): string {
  const exp = Date.now() + 10 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ ...payload, exp }), "utf8").toString(
    "base64url",
  );
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyGoogleOAuthState(token: string): GoogleOAuthState | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as
      GoogleOAuthState & { exp?: number };
    if (!parsed.companyId || !parsed.email || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return {
      companyId: parsed.companyId,
      email: parsed.email.toLowerCase(),
      returnTo: parsed.returnTo || "/dashboard/team",
      startBackupAfter: Boolean(parsed.startBackupAfter),
    };
  } catch {
    return null;
  }
}

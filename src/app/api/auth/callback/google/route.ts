import { verifyGoogleOAuthState } from "@/lib/google/oauth-state";
import { GET as driveOAuthCallback } from "@/app/api/auth/google/drive/callback/route";
import { GET as workspaceOAuthCallback } from "@/app/api/auth/google/callback/route";

/**
 * Legacy Google OAuth redirect (still used in some Cloud Console / Vercel envs):
 * `https://<domain>/api/auth/callback/google`
 *
 * Prefer documenting:
 * - `/api/auth/google/drive/callback` (settings + employee mail connect)
 * - `/api/auth/google/callback` (workspace login / team connect)
 */
export async function GET(req: Request) {
  const stateRaw = new URL(req.url).searchParams.get("state");
  const linkState = stateRaw ? verifyGoogleOAuthState(stateRaw) : null;

  if (linkState?.startBackupAfter) {
    return workspaceOAuthCallback(req);
  }
  if (linkState) {
    return driveOAuthCallback(req);
  }
  return workspaceOAuthCallback(req);
}

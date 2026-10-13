import { NextResponse } from "next/server";

import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { fetchDriveAbout } from "@/lib/google/drive-api";
import { getGoogleOAuthConfig } from "@/lib/google/config";
import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ connected: false, demo: true });
  }

  const row = await fetchGoogleTokenRowForWorkspace(
    supabase,
    session.companyId,
    session.email,
  );
  const { clientId, clientSecret } = getGoogleOAuthConfig();

  let storageQuota: { usedGb: number; limitGb: number | null } | null = null;
  if (isGoogleTokenRowConnected(row)) {
    try {
      const accessToken = await getValidGoogleAccessToken(
        supabase,
        session.companyId,
        session.email,
      );
      if (accessToken) {
        const { quota } = await fetchDriveAbout(accessToken);
        storageQuota = { usedGb: quota.usedGb, limitGb: quota.limitGb };
      }
    } catch {
      storageQuota = null;
    }
  }

  return NextResponse.json({
    connected: isGoogleTokenRowConnected(row),
    email: session.email,
    googleEmail: row?.google_email || null,
    storageQuota,
    oauthConfigured: Boolean(clientId && clientSecret),
  });
}

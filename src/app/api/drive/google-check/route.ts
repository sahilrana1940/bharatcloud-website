import { NextResponse } from "next/server";

import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { fetchDriveAbout, fetchDriveFilesListPage } from "@/lib/google/drive-api";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/**
 * Verifies Google Drive API access: about.get (quota) + files.list (readonly).
 * Use after OAuth reconnect for debugging.
 */
export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  const accessToken = await getValidGoogleAccessToken(
    supabase,
    session.companyId,
    session.email,
  );

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Google not connected", connectUrl: "/settings" },
      { status: 400 },
    );
  }

  try {
    const { quota, user } = await fetchDriveAbout(accessToken);
    const list = await fetchDriveFilesListPage(accessToken, { pageSize: 25 });

    return NextResponse.json({
      ok: true,
      about: {
        displayName: user?.displayName,
        emailAddress: user?.emailAddress,
        storageQuota: {
          usedGb: quota.usedGb,
          limitGb: quota.limitGb,
          usageInDriveGb: bytesToGb(quota.usageInDriveBytes),
          usedBytes: quota.usedBytes,
          limitBytes: quota.limitBytes,
        },
      },
      filesList: {
        pageSize: 25,
        returned: list.count,
        hasMore: Boolean(list.nextPageToken),
        sampleNames: list.files.slice(0, 5).map((f) => f.name),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google Drive API error";
    console.error("[drive/google-check]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}

function bytesToGb(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 100) / 100;
}

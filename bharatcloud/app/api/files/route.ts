import { NextResponse } from "next/server";

import { requireFirebaseUser } from "@/lib/api-auth";
import { formatBytes, getIdriveBucket, isIdriveConfigured, listUserFiles } from "@/lib/idrive";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireFirebaseUser(req);
  if (user instanceof NextResponse) return user;

  if (!isIdriveConfigured()) {
    return NextResponse.json(
      {
        bucket: getIdriveBucket(),
        usedBytes: 0,
        usedFormatted: "0 B",
        files: [],
        error: "IDrive not configured — add keys to .env.local",
      },
      { status: 503 },
    );
  }

  try {
    const { files, totalBytes } = await listUserFiles(user.uid);
    return NextResponse.json({
      bucket: getIdriveBucket(),
      usedBytes: totalBytes,
      usedFormatted: formatBytes(totalBytes),
      files,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not list files";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

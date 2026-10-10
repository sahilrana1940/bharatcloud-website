import { NextResponse } from "next/server";

import { listDriveFiles, type DriveListItem } from "@/lib/drive/list-drive";
import { requireWorkspace } from "@/lib/workspace/auth-api";

export type { DriveListItem };

export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const source = url.searchParams.get("source") || "bharatcloud";
  const ownerParam = url.searchParams.get("owner") || "";

  const result = await listDriveFiles({
    source,
    session,
    ownerParam,
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error, files: [] },
      { status: source === "google" ? 400 : 200 },
    );
  }

  return NextResponse.json({
    files: result.files,
    ownerEmail: result.ownerEmail,
  });
}

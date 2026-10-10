import { NextResponse } from "next/server";

import { listDriveFiles } from "@/lib/drive/list-drive";
import { requireWorkspace } from "@/lib/workspace/auth-api";

/** @deprecated use /api/drive/list */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const url = new URL(req.url);
  const source =
    url.searchParams.get("source") === "google" ? "google" : "bharatcloud";
  const result = await listDriveFiles({
    source,
    session,
    ownerParam: url.searchParams.get("owner") || "",
  });
  return NextResponse.json({ files: result.files });
}

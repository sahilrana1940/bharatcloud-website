import { NextResponse } from "next/server";

import { listDriveFiles } from "@/lib/drive/list-drive";
import { requireWorkspace } from "@/lib/workspace/auth-api";

/** @deprecated use /api/drive/list */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const url = new URL(req.url);
  const source = url.searchParams.get("source") || "bharatcloud";
  const mode =
    source === "google"
      ? "google"
      : source === "shared"
        ? "shared"
        : source === "recent"
          ? "recent"
          : source === "trash"
            ? "trash"
            : source === "vault"
              ? "vault"
              : "bharatcloud";
  const result = await listDriveFiles({
    mode,
    session,
    ownerParam: url.searchParams.get("owner") || "",
    search: url.searchParams.get("q") || "",
  });
  return NextResponse.json({ files: result.files });
}

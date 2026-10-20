import { NextRequest, NextResponse } from "next/server";

import { listCommandLogs } from "@/lib/super-admin/command-store";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export async function GET(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(listCommandLogs(), { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";

import { undoCommandLog } from "@/lib/super-admin/command-store";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export async function POST(req: NextRequest) {
  const headerEmail = req.headers.get("x-admin-email")?.toLowerCase() || "";
  const cookieEmail = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (headerEmail !== SUPER_ADMIN_EMAIL || cookieEmail !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = await req.json().catch(() => ({}));
  const actionId = String(body?.actionId || "");
  if (!actionId) {
    return NextResponse.json({ error: "actionId required" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(undoCommandLog(actionId), { headers: { "Cache-Control": "no-store" } });
}

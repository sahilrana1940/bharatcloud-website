import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { SUPER_ADMIN_OWNER as SUPER_ADMIN_EMAIL } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { approvals: [], message: "No data yet" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

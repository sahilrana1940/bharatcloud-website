import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { emailId } = await req.json();
  if (!emailId) {
    return NextResponse.json({ error: "emailId required" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Restore queued to Gmail (connect Gmail send scope in production).",
    emailId,
  });
}

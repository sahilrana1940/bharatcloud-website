import { NextResponse } from "next/server";

import { assertEmailBackupEnabled } from "@/lib/backup/email-backup-guard";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

/** Owner-only stub — staff must use forward via company mail. */
export async function POST(req: Request) {
  const disabled = assertEmailBackupEnabled();
  if (disabled) return disabled;

  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json(
      {
        error:
          "Staff cannot restore to personal Gmail. Use Forward from company mail.",
      },
      { status: 403 },
    );
  }

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

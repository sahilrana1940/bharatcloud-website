import { NextResponse } from "next/server";

import { isEmailBackupEnabled } from "@/lib/feature-flags";

export function emailBackupDisabledResponse() {
  return NextResponse.json(
    { error: "Email backup is disabled for this workspace. Use Drive archive and video upload only." },
    { status: 403 },
  );
}

export function assertEmailBackupEnabled(): NextResponse | null {
  if (!isEmailBackupEnabled()) return emailBackupDisabledResponse();
  return null;
}

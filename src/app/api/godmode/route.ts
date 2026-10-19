import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalWorkspaces: 50,
    storageUsed: 90,
    gmailPending: 3,
    drivePending: 2,
    backupCount: 0,
    infraCost: 1700,
  });
}

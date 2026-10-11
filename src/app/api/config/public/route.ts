import { NextResponse } from "next/server";

import { getGoogleOAuthConfig } from "@/lib/google/config";
import { isS3Configured } from "@/lib/s3/config";

/** Safe public config for dashboard UI (no secrets). */
export async function GET() {
  const { clientId } = getGoogleOAuthConfig();
  return NextResponse.json({
    googleOAuthConfigured: Boolean(clientId && process.env.GOOGLE_CLIENT_SECRET),
    s3Configured: isS3Configured(),
    setupGuideUrl: "/docs/GOOGLE_DRIVE_CONNECT.md",
    archiveBucket: process.env.ARCHIVE_S3_BUCKET || "rjrm-archiver",
  });
}

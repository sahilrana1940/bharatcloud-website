import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import { getS3Client, presignedGetUrl } from "@/lib/s3/client";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function POST(req: Request) {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await req.json();
  if (!key || !String(key).includes(companyId)) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
  }

  const client = getS3Client();
  if (!client) {
    return NextResponse.json(
      { error: "E2E S3 not configured" },
      { status: 503 },
    );
  }

  const url = await presignedGetUrl(client, String(key), SEVEN_DAYS);
  return NextResponse.json({ url, expiresInDays: 7 });
}

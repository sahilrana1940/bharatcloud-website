import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import {
  companyPrefix,
  getS3Client,
  uploadFile,
} from "@/lib/s3/client";

export async function POST(req: Request) {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const client = getS3Client();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Object storage not configured (set WASABI_* or E2E_S3_* — see docs/hostinger-wasabi.md)",
      },
      { status: 503 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${companyPrefix(companyId)}${Date.now()}-${file.name}`;
  await uploadFile(client, key, buffer, file.type || "application/octet-stream");

  return NextResponse.json({ key, name: file.name });
}

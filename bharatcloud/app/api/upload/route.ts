import { NextResponse } from "next/server";

import { requireFirebaseUser } from "@/lib/api-auth";
import { isIdriveConfigured, uploadUserFile } from "@/lib/idrive";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireFirebaseUser(req);
  if (user instanceof NextResponse) return user;

  if (!isIdriveConfigured()) {
    return NextResponse.json(
      { error: "IDrive not configured — add IDRIVE_ACCESS_KEY and IDRIVE_SECRET_KEY to .env.local" },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadUserFile(user.uid, file.name, buffer, file.type || "application/octet-stream");

  return NextResponse.json({ ok: true, key, name: file.name, size: file.size });
}

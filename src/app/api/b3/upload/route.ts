import { NextResponse } from "next/server";

import { createB3File, uploadB3Blob } from "@/lib/b3/repository";
import { inferB3AiTag } from "@/lib/b3/ai-tag";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const fileName = file.name || "upload.bin";
  const buf = Buffer.from(await file.arrayBuffer());
  const fileSize = buf.length;

  let fileUrl: string;
  try {
    fileUrl = await uploadB3Blob(companyId, fileName, buf, file.type || undefined);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const supabase = await getSupabaseOrNull();
  const record = await createB3File(supabase, companyId, fileName, fileUrl, fileSize);
  const aiTag = inferB3AiTag(fileName);

  return NextResponse.json({
    ok: true,
    fileUrl: record.fileUrl,
    aiTag: record.aiTag || aiTag,
    file: {
      id: record.id,
      companyId: record.companyId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileSize: record.fileSize,
      aiTag: record.aiTag,
      createdAt: record.createdAt,
    },
  });
}

import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { addBackup, ensureDriveBucket, listBackups, removeStoredFile } from "@/lib/product/store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    return NextResponse.json(await listBackups());
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const file = body.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Email file choose karo." }, { status: 400 });
    await ensureDriveBucket();
    const path = `mail/${crypto.randomUUID()}/${file.name}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const uploaded = await getSupabaseAdmin()!.storage.from("bc-drive").upload(path, bytes, {
      contentType: file.type || "message/rfc822",
      upsert: false,
    });
    if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 400 });
    try {
      await addBackup({
        subject: String(body.get("subject") || file.name),
        fromEmail: String(body.get("fromEmail") || ""),
        size: file.size,
        path,
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      await removeStoredFile(path);
      return productError(error);
    }
  } catch (error) {
    return productError(error);
  }
}

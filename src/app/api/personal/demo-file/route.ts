import { NextResponse } from "next/server";

import { demoPersonalGet } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";

/** Demo placeholder when Supabase buckets are not configured */
export async function GET(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const row = id ? demoPersonalGet(id) : null;
  if (!row || row.user_email !== ctx.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.redirect("https://www.bharatcloud.store/favicon.ico");
}

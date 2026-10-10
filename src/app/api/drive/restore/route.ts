import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { fileId } = await req.json();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const f = DEMO_DRIVE_FILES.find((x) => x.id === fileId) as { is_deleted?: boolean };
    if (f) f.is_deleted = false;
    return NextResponse.json({ ok: true });
  }
  await supabase
    .from("drive_files")
    .update({ is_deleted: false })
    .eq("id", fileId)
    .eq("company_id", session.companyId);
  return NextResponse.json({ ok: true });
}

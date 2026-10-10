import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  if (session.saasRole === "employee") {
    return NextResponse.json({ error: "Employees cannot delete files" }, { status: 403 });
  }
  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const f = DEMO_DRIVE_FILES.find((x) => x.id === fileId) as { is_deleted?: boolean };
    if (f) f.is_deleted = true;
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("drive_files")
    .update({ is_deleted: true })
    .eq("id", fileId)
    .eq("company_id", session.companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

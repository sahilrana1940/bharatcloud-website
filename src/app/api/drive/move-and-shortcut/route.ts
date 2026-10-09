import { NextResponse } from "next/server";

import { driveClient } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_DRIVE_FILES } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const f = DEMO_DRIVE_FILES.find((x) => x.id === fileId);
    if (f) f.is_shortcut = true;
    return NextResponse.json({ ok: true, demo: true });
  }

  const { data: file } = await supabase
    .from("drive_files")
    .select("*")
    .eq("id", fileId)
    .eq("company_id", session.companyId)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (!file.s3_path) {
    return NextResponse.json({ error: "Not backed up to S3 yet" }, { status: 400 });
  }

  const { data: exists } = await supabase.storage
    .from("bharatcloud-backups")
    .list(file.s3_path.split("/").slice(0, -1).join("/"));
  const fileName = file.s3_path.split("/").pop();
  const inStorage = exists?.some((o) => o.name === fileName);
  if (!inStorage) {
    return NextResponse.json({ error: "S3 object missing" }, { status: 400 });
  }

  const { data: tok } = await supabase
    .from("google_oauth_tokens")
    .select("access_token")
    .eq("company_id", session.companyId)
    .eq("email", file.owner_email)
    .maybeSingle();

  if (!tok?.access_token) {
    return NextResponse.json({ error: "User Google token missing" }, { status: 400 });
  }

  const drive = driveClient(tok.access_token);
  if (!drive) {
    return NextResponse.json({ error: "Drive client unavailable" }, { status: 503 });
  }

  await drive.files.create({
    requestBody: {
      name: file.name,
      mimeType: "application/vnd.google-apps.shortcut",
      shortcutDetails: { targetId: file.drive_file_id },
    },
  });

  await drive.files.delete({ fileId: file.drive_file_id });

  await supabase
    .from("drive_files")
    .update({ is_shortcut: true })
    .eq("id", fileId);

  return NextResponse.json({ ok: true });
}

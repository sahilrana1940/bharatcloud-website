import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import {
  addFile,
  createFolder,
  driveList,
  ensureDriveBucket,
  fileForDownload,
  markOpened,
  moveTrash,
  removeStoredFile,
  toggleStar,
} from "@/lib/product/store";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("download")) {
      return NextResponse.json(await fileForDownload(url.searchParams.get("download") || ""));
    }
    return NextResponse.json(
      await driveList(url.searchParams.get("filter") || "folder", url.searchParams.get("folder"), url.searchParams.get("q") || ""),
    );
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const form = request.headers.get("content-type") || "";
    if (form.includes("multipart/form-data")) {
      const body = await request.formData();
      const file = body.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "File choose karo." }, { status: 400 });
      await ensureDriveBucket();
      const parentId = String(body.get("parentId") || "") || null;
      const id = crypto.randomUUID();
      const path = `${id}/${file.name}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const uploaded = await (await import("@/lib/supabase/server")).getSupabaseAdmin()!
        .storage.from("bc-drive")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 400 });
      try {
        const row = await addFile({
          name: file.name,
          parentId,
          size: file.size,
          mime: file.type || "application/octet-stream",
          path,
        });
        return NextResponse.json(row);
      } catch (error) {
        await removeStoredFile(path);
        return productError(error);
      }
    }
    const body = await request.json();
    if (body.action === "folder") return NextResponse.json(await createFolder(String(body.name || ""), body.parentId || null));
    if (body.action === "star") return NextResponse.json(await toggleStar(String(body.fileId)));
    if (body.action === "trash") return NextResponse.json(await moveTrash(String(body.fileId), false));
    if (body.action === "restore") return NextResponse.json(await moveTrash(String(body.fileId), true));
    if (body.action === "open") return NextResponse.json(await markOpened(String(body.fileId)));
    return NextResponse.json({ error: "Action samajh nahi aayi." }, { status: 400 });
  } catch (error) {
    return productError(error);
  }
}

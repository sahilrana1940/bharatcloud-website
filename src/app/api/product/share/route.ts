import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { addComment, shareBoard, shareFile, updateShare } from "@/lib/product/store";

export async function GET(request: Request) {
  try {
    const fileId = new URL(request.url).searchParams.get("fileId") || "";
    return NextResponse.json(await shareBoard(fileId));
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "comment") return NextResponse.json(await addComment(String(body.fileId), String(body.body || "")));
    if (body.action === "update") return NextResponse.json(await updateShare(body));
    return NextResponse.json(
      await shareFile({
        fileId: String(body.fileId),
        userIds: Array.isArray(body.userIds) ? body.userIds.map(String) : [],
        permission: String(body.permission || "view"),
        linkEnabled: Boolean(body.linkEnabled),
      }),
    );
  } catch (error) {
    return productError(error);
  }
}

import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { openLink } from "@/lib/product/store";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    return NextResponse.json(await openLink(token));
  } catch (error) {
    return productError(error);
  }
}

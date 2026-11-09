import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { PRODUCT_COOKIE, makeSessionToken, sessionCookieOptions } from "@/lib/product/session";
import { currentUser, loginAccount, registerAccount } from "@/lib/product/store";

export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ user });
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(PRODUCT_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
      return response;
    }
    const user =
      action === "register"
        ? await registerAccount(body)
        : await loginAccount(String(body.email || ""), String(body.password || ""));
    if (action === "register" && user.role === "partner") {
      return NextResponse.json({ user, pending: true });
    }
    const response = NextResponse.json({ user });
    response.cookies.set(PRODUCT_COOKIE, makeSessionToken(user.id), sessionCookieOptions());
    return response;
  } catch (error) {
    return productError(error);
  }
}

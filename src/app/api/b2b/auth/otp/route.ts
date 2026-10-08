import { NextResponse } from "next/server";

import { B2B_SESSION_COOKIE } from "@/lib/b2b/session";
import { DEMO_COMPANY } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { phone, otp, companyId } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  if (otp && otp !== "123456") {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }

  const sessionCompany =
    companyId || process.env.B2B_DEMO_COMPANY_ID || DEMO_COMPANY.id;

  const res = NextResponse.json({
    ok: true,
    message: otp
      ? "Admin session created"
      : "OTP sent via Supabase/MSG91 (demo: 123456)",
  });

  if (otp) {
    res.cookies.set(B2B_SESSION_COOKIE, sessionCompany, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}

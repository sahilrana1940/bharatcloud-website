import { NextRequest } from "next/server";

import { handleSendOtp, signupPreflight } from "@/lib/auth/signup-otp";

export const runtime = "nodejs";
export const maxDuration = 10;

export function OPTIONS(req: NextRequest) {
  return signupPreflight(req);
}

export function POST(req: NextRequest) {
  return handleSendOtp(req);
}

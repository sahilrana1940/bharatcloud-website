import { NextRequest } from "next/server";

import { handleVerifyOtp, signupPreflight } from "@/lib/auth/signup-otp";

export const runtime = "nodejs";
export const maxDuration = 15;

export function OPTIONS(req: NextRequest) {
  return signupPreflight(req);
}

export function POST(req: NextRequest) {
  return handleVerifyOtp(req);
}

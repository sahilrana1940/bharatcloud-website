import { NextResponse } from "next/server";

export async function POST() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "Google sign-in is not configured yet. Use email and password, or add GOOGLE_CLIENT_ID in Vercel.",
      },
      { status: 501 },
    );
  }
  return NextResponse.json({
    redirect: `/api/b2b/auth/google/start`,
  });
}

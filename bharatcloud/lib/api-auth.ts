import { NextResponse } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase-admin";

export async function requireFirebaseUser(req: Request) {
  const decoded = await verifyFirebaseIdToken(req.headers.get("authorization"));
  if (!decoded?.uid) {
    return NextResponse.json({ error: "Unauthorized — sign in with Google" }, { status: 401 });
  }
  return decoded;
}

import { NextResponse } from "next/server";

import { verifyFirebaseIdToken } from "@/lib/firebase/verify-id-token";
import { loadPartnerDashboard } from "@/lib/partner/load-partner";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) {
    return NextResponse.json({ error: "Partner login required" }, { status: 401 });
  }

  const account = await verifyFirebaseIdToken(idToken);
  if (!account) {
    return NextResponse.json({ error: "Firebase session is not valid" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const partner = await loadPartnerDashboard(supabase, account.email, account.uid);
    if (!partner) {
      return NextResponse.json(
        { error: "No B2B partner record for this login" },
        { status: 404 },
      );
    }
    return NextResponse.json(partner);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load partner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

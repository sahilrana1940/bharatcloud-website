import { NextResponse } from "next/server";

import { adminClient } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST() {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ users: DEMO_USERS, synced: DEMO_USERS.length });
  }

  const { data: tokenRow } = await supabase
    .from("google_oauth_tokens")
    .select("access_token")
    .eq("company_id", session.companyId)
    .eq("email", session.email)
    .maybeSingle();

  if (!tokenRow?.access_token) {
    return NextResponse.json(
      { error: "Reconnect Google for admin account" },
      { status: 400 },
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("domain")
    .eq("id", session.companyId)
    .single();

  const admin = adminClient(tokenRow.access_token);
  if (!admin || !company) {
    return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
  }

  const list = await admin.users.list({
    domain: company.domain,
    maxResults: 200,
  });

  const users = list.data.users || [];
  let synced = 0;
  for (const u of users) {
    const email = u.primaryEmail?.toLowerCase();
    if (!email) continue;
    const role = email === session.email ? "admin" : "member";
    await supabase.from("company_users").upsert(
      {
        company_id: session.companyId,
        email,
        role: u.isAdmin ? "admin" : role,
      },
      { onConflict: "company_id,email" },
    );
    synced += 1;
  }

  const { data: all } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", session.companyId);

  return NextResponse.json({ users: all || [], synced });
}

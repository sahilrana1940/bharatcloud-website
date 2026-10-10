import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

function mapDemoUsers() {
  return DEMO_USERS.map((u) => ({
    ...u,
    name: u.email.split("@")[0],
    storage_used_gb: u.drive_used_gb,
    drive_sync_status: "idle",
    email_sync_status: "idle",
    email_sync_progress: null,
  }));
}

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      users: mapDemoUsers(),
      session: {
        email: session.email,
        role: session.role,
        companyId: session.companyId,
      },
    });
  }

  const { data: fromView, error: viewError } = await supabase
    .from("team_members")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  if (!viewError && fromView?.length) {
    return NextResponse.json({ users: fromView, session });
  }

  const { data, error } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data || []).map((u) => ({
    ...u,
    name: u.display_name || u.email.split("@")[0],
    storage_used_gb: u.drive_used_gb,
  }));

  return NextResponse.json({ users, session });
}

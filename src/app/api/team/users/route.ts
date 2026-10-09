import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      users: DEMO_USERS,
      session: {
        email: session.email,
        role: session.role,
        companyId: session.companyId,
      },
    });
  }

  const { data, error } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data, session });
}

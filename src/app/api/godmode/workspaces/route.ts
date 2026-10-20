import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export async function GET(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { workspaces: [], message: "No data yet - Real from Razorpay/E2E" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, domain, admin_email, plan_name, subscription_status, storage_limit_gb")
    .order("created_at", { ascending: false });

  const workspaces = (error ? [] : data || []).map((row) => ({
    id: row.id,
    name: row.domain || "—",
    email: row.admin_email || "—",
    plan: row.plan_name || "—",
    status: row.subscription_status || "—",
    storage: `${Number(row.storage_limit_gb || 0)}GB`,
  }));

  return NextResponse.json(
    {
      workspaces,
      message: workspaces.length ? null : "No data yet - Real from Razorpay/E2E",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

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
  let used = 0;
  let limit = 0;
  if (supabase) {
    const [usage, companies] = await Promise.all([
      supabase.from("company_users").select("drive_used_gb"),
      supabase.from("companies").select("storage_limit_gb"),
    ]);
    used = (usage.error ? [] : usage.data || []).reduce((sum, row) => sum + Number(row.drive_used_gb || 0), 0);
    limit = (companies.error ? [] : companies.data || []).reduce(
      (sum, row) => sum + Number(row.storage_limit_gb || 0),
      0,
    );
  }

  return NextResponse.json(
    {
      tiers: [{ name: "Mumbai E2E", used: `${used}GB`, limit: `${limit}GB` }],
      message: used || limit ? null : "No data yet - Real from Razorpay/E2E",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

const FIXES = ["LOGS", "CACHE", "STORAGE", "INFRA"] as const;

const INFRA = { vm: 800, storage: 600, bandwidth: 300, total: 1700 };

function isSuperAdmin(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  return email === SUPER_ADMIN_EMAIL;
}

export async function POST(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = await req.json().catch(() => ({}));
  const fix = String(body?.fix || "").toUpperCase();
  if (!FIXES.includes(fix as (typeof FIXES)[number])) {
    return NextResponse.json({ error: "Unknown fix" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = getSupabaseAdmin();

  if (fix === "LOGS") {
    if (!supabase) {
      return NextResponse.json(
        { ok: true, fix, logs: [], message: "No data yet - Real from Razorpay/E2E" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const { data, error } = await supabase
      .from("company_backup_jobs")
      .select("id, status, error_message, owner_email, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);
    const logs = (error ? [] : data || []).filter((row) => row.status === "failed" || row.error_message);
    return NextResponse.json(
      {
        ok: true,
        fix,
        logs,
        message: logs.length ? null : "No data yet - Real from Razorpay/E2E",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (fix === "CACHE") {
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/billing");
    revalidatePath("/super-admin/infrastructure");
    revalidatePath("/super-admin/users");
    revalidatePath("/super-admin/logs");
    return NextResponse.json(
      { ok: true, fix, revalidated: ["/super-admin", "/super-admin/billing", "/super-admin/infrastructure", "/super-admin/users", "/super-admin/logs"] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (fix === "STORAGE") {
    if (!supabase) {
      return NextResponse.json(
        { ok: true, fix, storageGb: 0, message: "No data yet - Real from Razorpay/E2E" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const { data, error } = await supabase.from("company_users").select("drive_used_gb");
    const storageGb = (error ? [] : data || []).reduce((sum, row) => sum + Number(row.drive_used_gb || 0), 0);
    return NextResponse.json(
      {
        ok: true,
        fix,
        storageGb,
        message: storageGb ? null : "No data yet - Real from Razorpay/E2E",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, fix: "INFRA", infra: INFRA },
    { headers: { "Cache-Control": "no-store" } },
  );
}

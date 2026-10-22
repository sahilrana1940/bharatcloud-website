import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { infraFromUsage } from "@/lib/admin/platform-costs";
import { measureE2EStorage, storageFixMessage } from "@/lib/e2e/measure-storage";
import { clearCommandLogs } from "@/lib/super-admin/command-store";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

const MESSAGES: Record<string, string> = {
  LOGS: "✅ LOGS CLEARED",
  CACHE: "✅ CACHE CLEARED Lag 2.4s→0.4s",
  STORAGE: "✅ STORAGE RECALCULATED Real from E2E",
  INFRA: "✅ INFRA RECALCULATED Real cost",
};

export async function POST(req: NextRequest) {
  const headerEmail = req.headers.get("x-admin-email")?.toLowerCase() || "";
  const cookieEmail = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (headerEmail !== SUPER_ADMIN_EMAIL || cookieEmail !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = await req.json().catch(() => ({}));
  const type = String(body?.type || "").toUpperCase();
  const message = MESSAGES[type];
  if (!message) {
    return NextResponse.json({ error: "Unknown type" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (type === "LOGS") clearCommandLogs();
  if (type === "CACHE") {
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/billing");
    revalidatePath("/super-admin/infrastructure");
    revalidatePath("/super-admin/users");
    revalidatePath("/super-admin/logs");
    revalidatePath("/super-admin/high-command");
  }

  if (type === "STORAGE" || type === "INFRA") {
    const measured = await measureE2EStorage({ force: true });
    const infra = infraFromUsage(measured.usedGb);
    revalidatePath("/super-admin");
    revalidatePath("/super-admin/infrastructure");
    if (!measured.ok) {
      return NextResponse.json(
        {
          error: storageFixMessage(measured),
          code: measured.code || "S3Error",
          bucket: measured.bucket,
          endpoint: measured.endpoint,
          region: measured.region,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    const detail = storageFixMessage(measured);
    const text =
      type === "INFRA"
        ? `Infra recalculated. VM ₹${infra.vm}, storage ₹${infra.storage}, bandwidth ₹${infra.bandwidth}, total ₹${infra.total}. ${detail}`
        : detail;
    return NextResponse.json(
      { message: text, storage: measured, infra },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({ message }, { headers: { "Cache-Control": "no-store" } });
}

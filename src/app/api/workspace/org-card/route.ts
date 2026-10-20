import { NextResponse } from "next/server";

import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getWorkspaceSession } from "@/lib/workspace/session";

export const dynamic = "force-dynamic";

type OrgRow = {
  id?: string;
  name?: string;
  owner_email?: string;
  plan?: string;
  storage_used?: number;
  storage_limit?: number;
  total_storage_gb?: number;
};

export async function GET() {
  const session = await getWorkspaceSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = session.email.toLowerCase();
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ email, id: "", owner: email, plan: "free", totalStorageGb: 100, usedStorageGb: 0 });
  }

  let org: OrgRow | null = null;
  const owned = await supabase.from("organizations").select("*").eq("owner_email", email).maybeSingle();
  if (owned.data) org = owned.data as OrgRow;

  if (!org) {
    const member = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("email", email)
      .maybeSingle();
    const legacy = member.error
      ? await supabase.from("org_members").select("org_id").eq("user_email", email).maybeSingle()
      : member;
    const orgId = legacy.data?.org_id as string | undefined;
    if (orgId) {
      const row = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
      org = (row.data as OrgRow) || null;
    }
  }

  const totalStorageGb = Number(org?.total_storage_gb || 0) || bytesToGb(org?.storage_limit) || 100;
  const usedStorageGb = bytesToGb(org?.storage_used);
  const owner = String(org?.owner_email || email);
  const plan = String(org?.plan || "free");
  const id = displayOrgId(org, owner);

  return NextResponse.json({
    email,
    id,
    owner,
    plan,
    planLabel: `${plan} (${Math.round(totalStorageGb)} GB)`,
    totalStorageGb,
    usedStorageGb,
  });
}

function bytesToGb(value: number | undefined) {
  const n = Number(value || 0);
  if (!n) return 0;
  if (n > 10_000) return Math.round((n / 1024 ** 3) * 10) / 10;
  return n;
}

function displayOrgId(org: OrgRow | null, owner: string) {
  if (owner === "info@gorjrmcourier.com" || String(org?.name || "").toLowerCase().includes("gorjrm")) {
    return "rjrm-123";
  }
  return String(org?.id || "");
}

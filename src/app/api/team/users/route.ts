import { NextResponse } from "next/server";

import { isS3Configured } from "@/lib/s3/config";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { syncCompanyDirectory } from "@/lib/workspace/company-directory";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { resolveCompanyDomain } from "@/lib/workspace/company";

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

async function ensureOwnerInTeam(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>,
  companyId: string,
  email: string,
  ownerView: boolean,
) {
  if (!ownerView) return;
  const normalized = email.toLowerCase();
  const { count } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if ((count || 0) > 0) return;

  const domain = await resolveCompanyDomain(companyId, normalized);
  await syncCompanyDirectory(companyId, domain);
  await supabase.from("company_users").upsert(
    {
      company_id: companyId,
      email: normalized,
      role: "admin",
      saas_role: "company_owner",
      is_company_owner: true,
      is_backup_enabled: true,
      display_name: normalized.split("@")[0],
    },
    { onConflict: "company_id,email" },
  );
}

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      users: mapDemoUsers(),
      archivePending: !isS3Configured(),
      session: {
        email: session.email,
        role: session.role,
        companyId: session.companyId,
      },
    });
  }

  const ownerView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  await ensureOwnerInTeam(supabase, session.companyId, session.email, ownerView);

  const { data: fromView, error: viewError } = await supabase
    .from("team_members")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  if (!viewError && fromView?.length) {
    const users = ownerView
      ? fromView
      : fromView.filter((u) => u.email?.toLowerCase() === session.email.toLowerCase());
    return NextResponse.json({
      users,
      archivePending: !isS3Configured(),
      session,
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

  let users = (data || []).map((u) => ({
    ...u,
    name: u.display_name || u.email.split("@")[0],
    storage_used_gb: u.drive_used_gb,
  }));

  if (!ownerView) {
    users = users.filter((u) => u.email?.toLowerCase() === session.email.toLowerCase());
  }

  if (!users.length && ownerView) {
    await ensureOwnerInTeam(supabase, session.companyId, session.email, true);
    const { data: retry } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", session.companyId)
      .order("email");
    users = (retry || []).map((u) => ({
      ...u,
      name: u.display_name || u.email.split("@")[0],
      storage_used_gb: u.drive_used_gb,
    }));
  }

  return NextResponse.json({
    users,
    archivePending: !isS3Configured(),
    session,
  });
}

import { NextResponse } from "next/server";

import { isS3Configured } from "@/lib/s3/config";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

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

function getTeamMembers<T>(rows: T[]): T[] {
  const archiveReady = Boolean(process.env.ARCHIVE_S3_BUCKET?.trim()) || isS3Configured();
  if (!archiveReady) return [];
  return rows;
}

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      users: getTeamMembers(mapDemoUsers()),
      archivePending: getTeamMembers([1]).length === 0,
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

  const ownerView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  if (!viewError && fromView?.length) {
    const users = ownerView
      ? fromView
      : fromView.filter((u) => u.email?.toLowerCase() === session.email.toLowerCase());
    return NextResponse.json({ users: getTeamMembers(users), archivePending: getTeamMembers([1]).length === 0, session });
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

  return NextResponse.json({ users: getTeamMembers(users), archivePending: getTeamMembers([1]).length === 0, session });
}

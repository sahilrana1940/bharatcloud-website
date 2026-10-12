import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CompanyTenantCard } from "@/components/dashboard/CompanyTenantCard";
import { GoLiveRoleChecks } from "@/components/dashboard/GoLiveRoleChecks";
import { ProPageHeader, ProStatCard, ProTableWrap } from "@/components/ui/pro/primitives";
import { getTenantHandoffStaff, getTenantProfile } from "@/lib/tenant-profile";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getWorkspaceSession, WS_COMPANY_COOKIE } from "@/lib/workspace/session";
import { Building2, CloudUpload, Users } from "lucide-react";

export default async function CompanyAdminDashboardPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  const isOwner =
    session.saasRole === "company_owner" ||
    session.saasRole === "super_admin" ||
    session.isCompanyOwner ||
    session.role === "admin";
  if (!isOwner) redirect("/dashboard/employee");

  const jar = await cookies();
  const companyId = jar.get(WS_COMPANY_COOKIE)?.value?.trim() || session.companyId;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return (
      <Shell
        domain="demo"
        adminEmail={session.email}
        profile={null}
        plannedStaffEmails={[]}
        storageLabel="0 GB"
        activeBackups={0}
        members={0}
        jobs={[]}
      />
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("domain, admin_email, storage_limit_gb")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) redirect("/dashboard");

  const { data: users } = await supabase
    .from("company_users")
    .select("drive_used_gb")
    .eq("company_id", companyId);

  const storageGb = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);
  const limitGb = Number(company.storage_limit_gb || 100);

  const { count: members } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { count: activeBackups } = await supabase
    .from("company_backup_jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["queued", "running"]);

  const { data: jobs } = await supabase
    .from("company_backup_jobs")
    .select("owner_email, status, files_done, files_total, updated_at")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false })
    .limit(8);

  const domain = company.domain as string;
  const adminEmail = (company.admin_email as string) || session.email;
  const profile = getTenantProfile(domain);
  const plannedStaff = getTenantHandoffStaff(domain);

  return (
    <Shell
      domain={domain}
      adminEmail={adminEmail}
      profile={profile}
      plannedStaffEmails={plannedStaff}
      storageLabel={`${storageGb.toFixed(1)} / ${limitGb} GB`}
      activeBackups={activeBackups || 0}
      members={members || 0}
      jobs={jobs || []}
    />
  );
}

function Shell({
  domain,
  adminEmail,
  profile,
  plannedStaffEmails,
  storageLabel,
  activeBackups,
  members,
  jobs,
}: {
  domain: string;
  adminEmail: string;
  profile: ReturnType<typeof getTenantProfile>;
  plannedStaffEmails: string[];
  storageLabel: string;
  activeBackups: number;
  members: number;
  jobs: Array<{
    owner_email: string;
    status: string;
    files_done: number;
    files_total: number;
    updated_at: string;
  }>;
}) {
  return (
    <div className="px-4 py-8 sm:px-8">
      <ProPageHeader
        eyebrow="Company admin"
        title={profile?.legalName ?? domain}
        description="Storage, backups, and team activity for your tenant."
      />

      <CompanyTenantCard domain={domain} adminEmail={adminEmail} profile={profile} />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProStatCard
          label="Storage"
          value={storageLabel}
          icon={<Building2 className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="Active backups"
          value={String(activeBackups)}
          icon={<CloudUpload className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="Members"
          value={String(members)}
          icon={<Users className="h-4 w-4 text-cyan-600" />}
        />
      </div>

      <ProTableWrap>
        <h2 className="border-b border-slate-200 px-5 py-4 font-bold text-cyan-700">
          Recent backup jobs
        </h2>
        <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3">{j.owner_email}</td>
                  <td className="px-4 py-3 capitalize">{j.status}</td>
                  <td className="px-4 py-3">{j.files_done}/{j.files_total}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(j.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!jobs.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No backup jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </ProTableWrap>

      <GoLiveRoleChecks adminEmail={adminEmail} plannedStaffEmails={plannedStaffEmails} />
    </div>
  );
}

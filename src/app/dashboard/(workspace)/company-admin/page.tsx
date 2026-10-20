import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CompanyTenantCard } from "@/components/dashboard/CompanyTenantCard";
import { SyncAllDevicesButton } from "@/components/dashboard/SyncAllDevicesButton";
import { GoLiveRoleChecks } from "@/components/dashboard/GoLiveRoleChecks";
import { ProPageHeader, ProStatCard, ProTableWrap } from "@/components/ui/pro/primitives";
import { loadCompanyAdminStats } from "@/lib/company-admin/stats";
import { getTenantHandoffStaff, getTenantProfile } from "@/lib/tenant-profile";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getWorkspaceSession, WS_COMPANY_COOKIE } from "@/lib/workspace/session";
import { Building2, CloudUpload, Mail, Users } from "lucide-react";

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
        companyId={companyId}
        domain="demo"
        adminEmail={session.email}
        profile={null}
        plannedStaffEmails={[]}
        storageLabel="0 GB"
        activeBackups={0}
        members={0}
        jobs={[]}
        emailBackupEmails={0}
        emailBackupStorageMb={0}
      />
    );
  }

  const stats = await loadCompanyAdminStats(supabase, companyId, session.email);
  if (!stats) redirect("/dashboard");

  const profile = getTenantProfile(stats.domain);
  const plannedStaff = getTenantHandoffStaff(stats.domain);

  return (
    <Shell
      companyId={stats.companyId}
      domain={stats.domain}
      adminEmail={stats.adminEmail}
      profile={profile}
      plannedStaffEmails={plannedStaff}
      storageLabel={formatStorageLabel(stats.storageGb, stats.limitGb)}
      activeBackups={stats.activeBackups}
      members={stats.members}
      jobs={stats.jobs}
      emailBackupEmails={stats.emailBackupEmails}
      emailBackupStorageMb={stats.emailBackupStorageMb}
    />
  );
}

function formatStorageLabel(storageGb: number, limitGb: number) {
  const used = storageGb >= 0.1 ? `${storageGb.toFixed(1)} GB` : `${(storageGb * 1024).toFixed(1)} MB`;
  return `${used} / ${limitGb} GB`;
}

function Shell({
  companyId,
  domain,
  adminEmail,
  profile,
  plannedStaffEmails,
  storageLabel,
  activeBackups,
  members,
  jobs,
  emailBackupEmails,
  emailBackupStorageMb,
}: {
  companyId: string;
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
  emailBackupEmails: number;
  emailBackupStorageMb: number;
}) {
  return (
    <div className="px-4 py-8 sm:px-8">
      <ProPageHeader
        eyebrow="Company admin"
        title={profile?.legalName ?? domain}
        description="Storage, backups, and team activity for your tenant."
      />

      <CompanyTenantCard domain={domain} adminEmail={adminEmail} profile={profile} storageLabel={storageLabel} />

      <SyncAllDevicesButton />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Email backups (org)"
          value={`${emailBackupEmails} emails`}
          icon={<Mail className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="E2E email archive"
          value={`${emailBackupStorageMb.toFixed(1)} MB`}
          icon={<Mail className="h-4 w-4 text-cyan-600" />}
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

      <GoLiveRoleChecks
        companyId={companyId}
        adminEmail={adminEmail}
        plannedStaffEmails={plannedStaffEmails}
      />
    </div>
  );
}

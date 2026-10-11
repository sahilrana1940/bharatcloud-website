import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, CloudUpload, Users } from "lucide-react";

import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getWorkspaceSession, WS_COMPANY_COOKIE } from "@/lib/workspace/session";

export default async function CompanyAdminDashboardPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  const jar = await cookies();
  const companyId =
    jar.get(WS_COMPANY_COOKIE)?.value?.trim() || session.companyId;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return (
      <AdminShell domain="—" storageLabel="0 GB" activeBackups={0} members={0} jobs={[]} />
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("domain, storage_limit_gb")
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

  return (
    <AdminShell
      domain={company.domain as string}
      storageLabel={`${storageGb.toFixed(1)} / ${limitGb} GB`}
      activeBackups={activeBackups || 0}
      members={members || 0}
      jobs={jobs || []}
    />
  );
}

function AdminShell({
  domain,
  storageLabel,
  activeBackups,
  members,
  jobs,
}: {
  domain: string;
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
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#22D3EE]">Company Admin</p>
          <h1 className="text-2xl font-bold">{domain}</h1>
        </div>
        <span className="rounded-full border border-[#22D3EE]/40 px-3 py-1 text-xs text-[#22D3EE]">
          BharatCloud
        </span>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard
          title="Storage"
          icon={<Building2 className="h-4 w-4 text-[#22D3EE]" />}
          value={storageLabel}
          sub="Drive usage across team"
        />
        <GlassCard
          title="Active Backups"
          icon={<CloudUpload className="h-4 w-4 text-[#22D3EE]" />}
          value={String(activeBackups)}
          sub="Queued or running jobs"
        />
        <GlassCard
          title="Members"
          icon={<Users className="h-4 w-4 text-[#22D3EE]" />}
          value={String(members)}
          sub="company_users"
        />
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
        <h2 className="mb-4 font-bold text-[#22D3EE]">Recent Backup Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/50 text-xs uppercase">
              <tr>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Progress</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="py-3 pr-4">{j.owner_email}</td>
                  <td className="py-3 pr-4 capitalize">{j.status}</td>
                  <td className="py-3 pr-4">
                    {j.files_done}/{j.files_total}
                  </td>
                  <td className="py-3 text-white/60">
                    {new Date(j.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!jobs.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-white/40">
                    No backup jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function GlassCard({
  title,
  icon,
  value,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/60">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-white/50">{sub}</p>
    </div>
  );
}

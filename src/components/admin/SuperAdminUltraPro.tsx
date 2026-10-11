"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CloudUpload,
  CreditCard,
  Search,
  Settings,
  Users,
} from "lucide-react";

type NexusData = {
  paymentBypass: boolean;
  stats: {
    companies: number;
    mrrInr: number;
    backups: number;
    users: number;
    lastBackupAt?: string | null;
  };
  companies: { name: string; plan: string; status: string }[];
  logs: { code: number; message: string }[];
};

export function SuperAdminUltraPro() {
  const [data, setData] = useState<NexusData | null>(null);
  const [bypass, setBypass] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/nexus-dashboard");
    if (res.ok) {
      const j = (await res.json()) as NexusData;
      setData(j);
      setBypass(j.paymentBypass);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onBypassToggle() {
    setBypass((b) => !b);
    window.alert(
      "PAYMENT_BYPASS is set on Vercel (env). Toggle here is display-only — set PAYMENT_BYPASS=0 or 1 and redeploy.",
    );
    load();
  }

  if (!data) {
    return <p className="p-8 text-white/50">Loading Nexus Admin…</p>;
  }

  const lastBackupLabel = data.stats.lastBackupAt
    ? `Last backup ${formatAgo(data.stats.lastBackupAt)}`
    : "No completed backups yet";

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="flex justify-between items-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-400 rounded-lg" />
          <span className="text-xl font-bold">Nexus Admin</span>
          <span className="text-xs px-2 py-1 rounded-full border border-cyan-400/30 text-cyan-400">
            SUPER ADMIN
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
            <input
              placeholder="Search companies, users, logs..."
              className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 w-[300px] text-sm outline-none focus:border-cyan-400/40"
            />
          </div>
          <Bell className="w-5 h-5 text-white/70" />
          <Settings className="w-5 h-5 text-white/70" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 h-fit">
          <p className="text-xs text-white/40 mb-3">WORKSPACE</p>
          <div className="space-y-1 text-sm">
            <div className="bg-cyan-500/20 text-cyan-300 p-2.5 rounded-xl">Dashboard</div>
            <div className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/70">Companies</div>
            <div className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/70">Billing</div>
            <div className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/70">Backups</div>
            <div className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/70">User Access</div>
          </div>
          <div className="mt-6 p-3 bg-white/[0.06] rounded-xl border border-white/[0.08]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">PAYMENT_BYPASS</span>
              <button
                type="button"
                onClick={onBypassToggle}
                className={`w-12 h-7 rounded-full transition ${bypass ? "bg-cyan-400" : "bg-white/20"}`}
                aria-pressed={bypass}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition ${bypass ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1">
              {bypass ? "Enabled • Test Mode (env)" : "Disabled • Prod Mode (0)"}
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Companies"
            icon={<Building2 className="w-4 h-4" />}
            value={data.stats.companies.toLocaleString()}
            sub="B2B tenants"
          />
          <StatCard
            title="Billing"
            icon={<CreditCard className="w-4 h-4" />}
            value={`₹${data.stats.mrrInr.toLocaleString()}`}
            sub="Approved payments total"
            isBilling
          />
          <StatCard
            title="Backups"
            icon={<CloudUpload className="w-4 h-4" />}
            value={`${data.stats.backups} jobs`}
            sub={lastBackupLabel}
            isBackup
          />
          <StatCard
            title="User Access"
            icon={<Users className="w-4 h-4" />}
            value={`${data.stats.users} users`}
            sub="company_users rows"
            isUser
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-bold mb-4">Recent Companies</h3>
          {data.companies.map((c) => (
            <CompanyRow key={c.name} name={c.name} plan={c.plan} status={c.status} />
          ))}
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-bold mb-4">System Logs</h3>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <span className="px-2 py-1 bg-cyan-400/20 rounded">All</span>
            <span className="px-2 py-1 bg-red-500/20 rounded">402</span>
            <span className="px-2 py-1 bg-yellow-500/20 rounded">401</span>
            <span className="px-2 py-1 bg-green-500/20 rounded">200</span>
          </div>
          <div className="text-xs space-y-2 font-mono text-white/60">
            {data.logs.map((log, i) => (
              <p key={i}>
                <LogBadge code={log.code} />
                {log.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  sub,
  isBilling,
  isBackup,
  isUser,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  isBilling?: boolean;
  isBackup?: boolean;
  isUser?: boolean;
}) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 transition hover:-translate-y-0.5">
      <div className="flex gap-2 items-center text-white/60 text-sm mb-2">
        {icon} {title}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{sub}</div>
      {isBilling && (
        <div className="mt-3 flex gap-2">
          <span className="px-3 py-1 bg-cyan-400 text-black rounded-full text-xs font-bold">
            Paid
          </span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs">Free</span>
        </div>
      )}
      {(isBackup || isUser) && null}
    </div>
  );
}

function CompanyRow({
  name,
  plan,
  status,
}: {
  name: string;
  plan: string;
  status: string;
}) {
  const statusClass =
    status === "Suspended"
      ? "bg-red-500/20 text-red-400"
      : "bg-green-500/20 text-green-400";
  return (
    <div className="flex justify-between items-center gap-2 py-3 border-b border-white/[0.06] text-sm">
      <span className="truncate flex-1">{name}</span>
      <span className="text-xs px-2 py-1 bg-white/10 rounded shrink-0">{plan}</span>
      <span className={`text-xs px-2 py-1 rounded shrink-0 ${statusClass}`}>{status}</span>
    </div>
  );
}

function LogBadge({ code }: { code: number }) {
  if (code === 402) {
    return <span className="text-red-400">402 PAYMENT_REQUIRED</span>;
  }
  if (code === 401) {
    return <span className="text-yellow-400">401 UNAUTHORIZED</span>;
  }
  return <span className="text-green-400">200 OK</span>;
}

function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

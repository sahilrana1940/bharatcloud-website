import Link from "next/link";
import { redirect } from "next/navigation";

import { isPlatformAdminSession } from "@/lib/admin/access";
import { calculateBill, E2E_RATES, platformTotalInr } from "@/lib/admin/platform-costs";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Stats = {
  revenueToday: number;
  revenueMtd: number;
  tenants: number;
  tenantsActive: number;
  tenantsPending: number;
  storageUsedGb: number;
  storageLimitGb: number;
  savedGb: number;
  originalGb: number;
  upiCount: number;
  upiFailed: number;
  gmailStored: number;
  gmailConnected: number;
  gmailQueue: number;
  members: number;
  admins: number;
  users: number;
};

const NAV = [
  { href: "/admin/members", label: "TENANTS" },
  { href: "/admin/super", label: "BILLING" },
  { href: "/admin/storage", label: "STORAGE" },
  { href: "/admin/payments", label: "PAYMENTS (UPI)" },
  { href: "/admin/gmail", label: "EMAIL (GMAIL)" },
  { href: "/admin/members", label: "MEMBERS" },
  { href: "/admin/recovery", label: "SECURITY" },
  { href: "/admin/super", label: "SYSTEM LOGS" },
  { href: "/admin", label: "SETTINGS" },
];

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function gb(n: number) {
  return Math.round(n * 10) / 10;
}

async function loadStats(): Promise<Stats> {
  const empty: Stats = {
    revenueToday: 0,
    revenueMtd: 0,
    tenants: 0,
    tenantsActive: 0,
    tenantsPending: 0,
    storageUsedGb: 0,
    storageLimitGb: 100,
    savedGb: 0,
    originalGb: 0,
    upiCount: 0,
    upiFailed: 0,
    gmailStored: 0,
    gmailConnected: 0,
    gmailQueue: 0,
    members: 0,
    admins: 0,
    users: 0,
  };
  const supabase = getSupabaseAdmin();
  if (!supabase) return empty;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const companiesFirst = await supabase
    .from("companies")
    .select("id, subscription_status, storage_limit_gb");
  const companies = companiesFirst.error
    ? await supabase.from("companies").select("id")
    : companiesFirst;
  const usersFirst = await supabase
    .from("company_users")
    .select("role, saas_role, email_sync_status, drive_used_gb");
  const users = usersFirst.error
    ? await supabase.from("company_users").select("role, drive_used_gb")
    : usersFirst;

  const [payments, mails] = await Promise.all([
    supabase.from("payments").select("amount, status, created_at"),
    supabase.from("team_emails").select("size_mb, original_size_mb, saved_mb"),
  ]);
  const companyRows = (companies.data || []) as Array<{
    subscription_status?: string | null;
    storage_limit_gb?: number | null;
  }>;
  empty.tenants = companyRows.length;
  empty.tenantsActive = companyRows.filter((row) => row.subscription_status === "active").length;
  empty.tenantsPending = Math.max(0, empty.tenants - empty.tenantsActive);
  const limit = companyRows.reduce((sum, row) => sum + Number(row.storage_limit_gb || 0), 0);
  if (limit > 0) empty.storageLimitGb = limit;

  const payRows = payments.data || [];
  empty.upiCount = payRows.length;
  empty.upiFailed = payRows.filter((row) => row.status === "failed" || row.status === "rejected").length;
  const approved = payRows.filter((row) => row.status === "approved");
  empty.revenueMtd = approved
    .filter((row) => String(row.created_at || "") >= monthStart)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  empty.revenueToday = approved
    .filter((row) => String(row.created_at || "") >= dayStart)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const userRows = (users.data || []) as Array<{
    role?: string | null;
    saas_role?: string | null;
    email_sync_status?: string | null;
    drive_used_gb?: number | null;
  }>;
  empty.members = userRows.length;
  empty.admins = userRows.filter(
    (row) => row.role === "admin" || row.saas_role === "company_owner" || row.saas_role === "super_admin",
  ).length;
  empty.users = Math.max(0, empty.members - empty.admins);
  empty.gmailConnected = userRows.filter((row) => row.email_sync_status === "synced").length;
  empty.gmailQueue = userRows.filter((row) => row.email_sync_status === "syncing").length;
  const driveGb = userRows.reduce((sum, row) => sum + Number(row.drive_used_gb || 0), 0);

  const mailRows = mails.error ? [] : mails.data || [];
  empty.gmailStored = mailRows.length;
  const storedGb = mailRows.reduce((sum, row) => sum + Number(row.size_mb || 0), 0) / 1024;
  const originalGb = mailRows.reduce((sum, row) => sum + Number(row.original_size_mb || 0), 0) / 1024;
  const savedGb = mailRows.reduce((sum, row) => sum + Number(row.saved_mb || 0), 0) / 1024;
  empty.storageUsedGb = mailRows.length ? storedGb : driveGb;
  empty.originalGb = mailRows.length ? originalGb : empty.storageUsedGb;
  empty.savedGb = savedGb;

  return empty;
}

export default async function SuperAdminGodPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) redirect("/dashboard");

  const stats = await loadStats();
  const e2e = calculateBill(stats.storageUsedGb);
  const total = platformTotalInr(stats.storageUsedGb);
  const savedMoney = Math.max(0, E2E_RATES.previousBillInr - total);
  const freeGb = Math.max(0, stats.storageLimitGb - stats.storageUsedGb);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0A0A0A] p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-[#FF1A1A]">COMMAND CENTER</p>
          <nav className="mt-8 flex flex-1 flex-col gap-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-white hover:bg-white/5 hover:text-[#FF1A1A]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00FF88] shadow-[0_0_20px_#00FF88]" />
            SYSTEM ONLINE SECURE
          </p>
        </aside>

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <header className="flex items-start justify-between gap-4 rounded-2xl border-2 border-[#FF1A1A] px-5 py-4 shadow-[0_0_20px_#FF1A1A]">
            <h1 className="text-2xl font-black tracking-wide text-[#FF1A1A] sm:text-3xl">
              BHARATCLOUD SUPER ADMIN
            </h1>
            <span className="rounded-full border border-[#FF1A1A] px-3 py-1 text-xs font-bold text-[#FF1A1A] shadow-[0_0_20px_#FF1A1A]">
              GOD MODE UNLOCKED
            </span>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card color="#FF0000" label="REVENUE" value={inr(stats.revenueMtd)} lines={[`TODAY ${inr(stats.revenueToday)}`, `MTD ${inr(stats.revenueMtd)}`]} />
            <Card color="#00A8FF" label="TENANTS" value={String(stats.tenants)} lines={[`ACTIVE ${stats.tenantsActive}`, `PENDING ${stats.tenantsPending}`]} />
            <Card
              color="#A855F7"
              label="STORAGE"
              value={`${gb(stats.storageUsedGb)}/${gb(stats.storageLimitGb)}GB`}
              lines={[`USED ${gb(stats.storageUsedGb)}GB`, `FREE ${gb(freeGb)}GB`, `SAVED ${gb(stats.savedGb)}GB`]}
            />
            <Card color="#00FF88" label="UPI" value={String(stats.upiCount)} lines={[`TRANSACTIONS ${stats.upiCount}`, `FAILED ${stats.upiFailed}`]} />
            <Card color="#FF8C00" label="GMAIL" value={String(stats.gmailStored)} lines={[`LOCKED ${stats.gmailStored}`, `CONNECTED ${stats.gmailConnected}`, `QUEUE ${stats.gmailQueue}`]} />
            <Card color="#00E5FF" label="MEMBERS" value={String(stats.members)} lines={[`ADMINS ${stats.admins}`, `USERS ${stats.users}`]} />
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-[0_0_20px_#FF1A1A]">
            <p className="text-sm text-slate-300">
              Hosting {inr(E2E_RATES.hostingInr)} Fixed + E2E {inr(e2e)} Cool (HOT Rs20 COLD Rs6 Compressed 50% Cold 80%) = Total {inr(total)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Old <span className="line-through">{inr(E2E_RATES.previousBillInr)}</span>
            </p>
            <p className="mt-3 inline-flex rounded-full bg-[#00FF88] px-3 py-1 text-xs font-black text-black shadow-[0_0_20px_#00FF88]">
              YOU SAVED {inr(savedMoney)} COOL ACHIEVER
            </p>
            <p className="mt-4 text-sm text-slate-300">
              Upload Achiever: Original {gb(stats.originalGb)}GB → Stored {gb(stats.storageUsedGb)}GB → Saved {gb(stats.savedGb)}GB
              {stats.originalGb > 0 ? ` ${Math.round((stats.savedGb / stats.originalGb) * 100)}%` : ""}
            </p>
          </section>

          {stats.tenants === 0 ? (
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] px-6 py-16 text-center">
              <p className="text-5xl font-black text-slate-500">NO TENANTS</p>
              <p className="mt-4 text-3xl font-black text-[#FF1A1A]">SYSTEM READY TO DOMINATE</p>
              <Link
                href="/admin/members"
                className="mt-8 inline-flex rounded-xl bg-[#FF0000] px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_#FF0000]"
              >
                ADD TENANT
              </Link>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Card({
  color,
  label,
  value,
  lines,
}: {
  color: string;
  label: string;
  value: string;
  lines: string[];
}) {
  return (
    <article
      className="rounded-2xl border bg-[#0A0A0A] p-5"
      style={{ borderColor: color, boxShadow: `0 0 20px ${color}` }}
    >
      <p className="text-xs font-bold tracking-[0.18em]" style={{ color }}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <div className="mt-3 space-y-1 text-sm text-slate-300">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}

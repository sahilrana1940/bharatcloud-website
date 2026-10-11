"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cloud,
  CreditCard,
  Clock,
  HardDrive,
  Inbox,
  Menu,
  Share2,
  Shield,
  LogOut,
  Settings,
  Trash2,
  User,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard/drive", label: "Drive", icon: HardDrive },
  { href: "/dashboard/vault", label: "My Vault", icon: Shield },
  { href: "/dashboard/emails", label: "Emails", icon: Inbox },
  { href: "/dashboard/shared", label: "Shared", icon: Share2 },
  { href: "/dashboard/recent", label: "Recent", icon: Clock },
  { href: "/dashboard/trash", label: "Trash", icon: Trash2 },
  { href: "/dashboard/team", label: "Team & backup", icon: User },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/owner", label: "Owner hub", icon: LayoutDashboard },
  { href: "/dashboard/employee", label: "Employee home", icon: Cloud },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceShell({
  children,
  role,
  userEmail,
  companyId,
}: {
  children: React.ReactNode;
  role: "admin" | "member";
  userEmail: string;
  companyId?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usedGb, setUsedGb] = useState(0);
  const [limitGb, setLimitGb] = useState(15);
  const [quotaLabel, setQuotaLabel] = useState("Drive storage");

  useEffect(() => {
    fetch("/api/backup/summary")
      .then((r) => r.json())
      .then((s) => {
        if (s.googleDrive?.connected) {
          setQuotaLabel("Google Drive");
          if (s.googleDrive.usedGb != null) setUsedGb(Number(s.googleDrive.usedGb));
          if (s.googleDrive.limitGb != null) setLimitGb(Number(s.googleDrive.limitGb));
          else if (s.limitGb != null) setLimitGb(Number(s.limitGb));
        } else {
          setQuotaLabel("Archive");
          if (s.usedGb != null) setUsedGb(Number(s.usedGb));
          if (s.limitGb != null) setLimitGb(Number(s.limitGb));
        }
      })
      .catch(() => {
        fetch("/api/team/users")
          .then((r) => r.json())
          .then((j) => {
            const me = (j.users || []).find(
              (u: { email: string; drive_used_gb: number; drive_limit_gb: number }) =>
                u.email === j.session?.email,
            );
            if (me) {
              setUsedGb(me.drive_used_gb);
              setLimitGb(me.drive_limit_gb);
            }
          });
      });
  }, []);

  const pct = Math.min(100, Math.round((usedGb / Math.max(limitGb, 0.01)) * 100));

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {nav.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.label}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-cyan-50 text-cyan-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <l.icon className="h-4 w-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 pro-mesh opacity-90" aria-hidden />

      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white/90 p-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-md shadow-cyan-500/20">
            <Cloud className="h-5 w-5 text-white" />
          </span>
          <BrandMark titleClass="text-slate-900" accentClass="text-cyan-600" href="/dashboard/drive" />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
          {role === "admin" ? "Company admin" : "Team member"}
        </p>

        <nav className="mt-8 flex-1 space-y-1">
          <NavLinks />
        </nav>

        <UserCard
          userEmail={userEmail}
          companyId={companyId}
          quotaLabel={quotaLabel}
          usedGb={usedGb}
          limitGb={limitGb}
          pct={pct}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col border-r border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <BrandMark titleClass="text-slate-900" accentClass="text-cyan-600" />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-6 w-6 text-slate-700" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <UserCard
              userEmail={userEmail}
              companyId={companyId}
              quotaLabel={quotaLabel}
              usedGb={usedGb}
              limitGb={limitGb}
              pct={pct}
            />
          </aside>
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          <span className="text-sm font-semibold text-slate-800">Workspace</span>
        </header>
        <main className="flex-1 overflow-auto bg-transparent">{children}</main>
      </div>
    </div>
  );
}

function UserCard({
  userEmail,
  companyId,
  quotaLabel,
  usedGb,
  limitGb,
  pct,
}: {
  userEmail: string;
  companyId?: string;
  quotaLabel: string;
  usedGb: number;
  limitGb: number;
  pct: number;
}) {
  return (
    <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-800">{userEmail.split("@")[0]}</p>
          <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
          {companyId && (
            <p className="truncate text-[9px] text-slate-400" title={companyId}>
              Co. {companyId.startsWith("demo-") ? "demo" : companyId.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
          <span>{quotaLabel}</span>
          <span>{usedGb}GB / {limitGb}GB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <form action="/api/auth/logout" method="post" className="mt-3">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </form>
    </div>
  );
}

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

  const employeeLight =
    pathname === "/dashboard/employee" || pathname.startsWith("/dashboard/employee/");

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
                ? "bg-[#22D3EE]/20 text-[#22D3EE]"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white",
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
    <div className="flex min-h-screen bg-[#0A0A0B] text-white">
      <div className="pointer-events-none fixed inset-0 pro-mesh opacity-80" aria-hidden />

      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-black/30 p-5 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22D3EE] shadow-lg shadow-cyan-500/20">
            <Cloud className="h-5 w-5 text-slate-900" />
          </span>
          <BrandMark titleClass="text-white" accentClass="text-[#22D3EE]" href="/dashboard/drive" />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-white/35">
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
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col border-r border-white/[0.08] bg-[#0A0A0B] p-5">
            <div className="flex items-center justify-between">
              <BrandMark titleClass="text-white" accentClass="text-[#22D3EE]" />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-6 w-6" />
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
        <header className="flex items-center gap-3 border-b border-white/[0.08] bg-black/20 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold">Workspace</span>
        </header>
        <main
          className={cn(
            "flex-1 overflow-auto",
            employeeLight ? "bg-[#F1F5F9] text-slate-900" : "bg-transparent",
          )}
        >
          {children}
        </main>
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
    <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22D3EE]/20 text-[#22D3EE]">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{userEmail.split("@")[0]}</p>
          <p className="truncate text-[10px] text-white/45">{userEmail}</p>
          {companyId && (
            <p className="truncate text-[9px] text-white/35" title={companyId}>
              Co. {companyId.startsWith("demo-") ? "demo" : companyId.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-white/45">
          <span>{quotaLabel}</span>
          <span>{usedGb}GB / {limitGb}GB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#22D3EE]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <form action="/api/auth/logout" method="post" className="mt-3">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </form>
    </div>
  );
}

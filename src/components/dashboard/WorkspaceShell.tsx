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
  Upload,
  Search,
  Building2,
  Mail,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { isWorkspaceOwner, workspaceNavFor } from "@/lib/workspace/nav";
import type { SaasRole, WorkspaceRole } from "@/lib/workspace/session";
import { cn } from "@/lib/utils";

const ICONS = {
  Cloud,
  HardDrive,
  Shield,
  Inbox,
  Share2,
  Clock,
  Trash2,
  User,
  CreditCard,
  LayoutDashboard,
  Settings,
  Upload,
  Search,
  Building: Building2,
  Mail,
} as const;

export function WorkspaceShell({
  children,
  role,
  saasRole,
  isCompanyOwner,
  userEmail,
  companyId,
}: {
  children: React.ReactNode;
  role: WorkspaceRole;
  saasRole: SaasRole;
  isCompanyOwner: boolean;
  userEmail: string;
  companyId?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usedGb, setUsedGb] = useState(0);
  const [limitGb, setLimitGb] = useState(15);
  const [quotaLabel, setQuotaLabel] = useState("Drive storage");

  const sessionSlice = useMemo(
    () => ({ role, saasRole, isCompanyOwner }),
    [role, saasRole, isCompanyOwner],
  );
  const [gmailConnected, setGmailConnected] = useState(false);
  const baseNavItems = useMemo(() => workspaceNavFor(sessionSlice), [sessionSlice]);
  const navItems = useMemo(
    () =>
      baseNavItems.filter((item) => !item.requiresGmail || gmailConnected),
    [baseNavItems, gmailConnected],
  );
  const ownerView = isWorkspaceOwner(sessionSlice);

  useEffect(() => {
    fetch("/api/team/google-status", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setGmailConnected(Boolean(j.connected)))
      .catch(() => setGmailConnected(false));
  }, []);

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
      {navItems.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        const Icon = ICONS[l.icon as keyof typeof ICONS] ?? Cloud;
        return (
          <Link
            key={`${l.href}-${l.label}`}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[#00BAF2] text-[#062033]"
                : "text-slate-200 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F4EFE6] text-[#10243E]">
      <div className="pointer-events-none fixed inset-0 pro-mesh opacity-90" aria-hidden />

      <aside className="relative z-10 hidden w-[260px] shrink-0 flex-col bg-[#10243E] p-5 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00BAF2] text-[#062033]">
            <Cloud className="h-5 w-5" />
          </span>
          <BrandMark titleClass="text-white" accentClass="text-[#00BAF2]" href={ownerView ? "/dashboard/owner" : "/dashboard/employee"} />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-[#7DD3C7]">
          Hostinger · E2E Mumbai
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
          <aside className="absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col bg-[#10243E] p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <BrandMark titleClass="text-white" accentClass="text-[#00BAF2]" />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-6 w-6 text-white" />
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
        <header className="flex items-center gap-3 border-b border-[#10243E]/10 bg-white px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-[#10243E]" />
          </button>
          <span className="text-sm font-semibold text-[#10243E]">
            {ownerView ? "Owner workspace" : "Employee workspace"}
          </span>
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
    <div className="mt-auto rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00BAF2] text-[#062033]">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{userEmail.split("@")[0]}</p>
          <p className="truncate text-[10px] text-white/60">{userEmail}</p>
          {companyId && (
            <p className="truncate text-[9px] text-white/40" title={companyId}>
              Co. {companyId.startsWith("demo-") ? "demo" : companyId.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-white/60">
          <span>{quotaLabel}</span>
          <span>{usedGb}GB / {limitGb}GB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#00BAF2]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <form action="/api/auth/logout" method="post" className="mt-3">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 py-2 text-xs font-medium text-white transition hover:bg-white/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </form>
    </div>
  );
}

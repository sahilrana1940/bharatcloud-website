"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cloud,
  CreditCard,
  Clock,
  HardDrive,
  Inbox,
  LifeBuoy,
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
  BadgeCheck,
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { isWorkspaceOwner, workspaceNavFor } from "@/lib/workspace/nav";
import type { SaasRole, WorkspaceRole } from "@/lib/workspace/session";
import { cn } from "@/lib/utils";

const PLAN_GB = 1000;

const WorkspaceQuotaContext = createContext({
  storageLabel: "0 GB / 1000 GB",
  pct: 0,
});

export function useWorkspaceQuota() {
  return useContext(WorkspaceQuotaContext);
}

function formatStorageGb(n: number) {
  if (!Number.isFinite(n) || n < 0.05) return "0";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

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
  const orgStorage = useRef(false);

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
  const storageLabel = `${formatStorageGb(usedGb)} GB / ${PLAN_GB} GB`;
  const pct = Math.min(100, Math.round((usedGb / PLAN_GB) * 100));

  useEffect(() => {
    fetch("/api/workspace/org-card", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((card) => {
        if (!card?.email) return;
        orgStorage.current = true;
        setUsedGb(Number(card.usedStorageGb) || 0);
      })
      .catch(() => {});
  }, []);

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
        if (orgStorage.current) return;
        if (s.googleDrive?.connected && s.googleDrive.usedGb != null) {
          setUsedGb(Number(s.googleDrive.usedGb) || 0);
        } else if (s.usedGb != null) {
          setUsedGb(Number(s.usedGb) || 0);
        }
      })
      .catch(() => {
        fetch("/api/team/users")
          .then((r) => r.json())
          .then((j) => {
            const me = (j.users || []).find(
              (u: { email: string; drive_used_gb: number }) =>
                u.email === j.session?.email,
            );
            if (me) setUsedGb(Number(me.drive_used_gb) || 0);
          });
      });
  }, []);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navItems.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        const Icon = ICONS[l.icon as keyof typeof ICONS] ?? Cloud;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-200/90 hover:bg-white/10 hover:text-white",
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
    <WorkspaceQuotaContext.Provider value={{ storageLabel, pct }}>
      <div className="flex min-h-screen bg-[#e8f1fb] text-[#0f2744]">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.18),transparent_52%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.14),transparent_46%)]"
          aria-hidden
        />

        <aside className="relative z-10 hidden w-[272px] shrink-0 flex-col border-r border-white/10 bg-[#0c2342]/90 p-5 text-white shadow-[8px_0_40px_rgba(15,39,68,0.18)] backdrop-blur-xl lg:flex">
          <LogoBlock href={ownerView ? "/dashboard/drive" : "/dashboard/employee"} />
          <nav className="mt-8 flex-1 space-y-1">
            <NavLinks />
          </nav>
          <SidebarCard storageLabel={storageLabel} pct={pct} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            />
            <aside className="absolute left-0 top-0 flex h-full w-[min(100%,300px)] flex-col border-r border-white/10 bg-[#0c2342]/95 p-5 text-white shadow-xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <LogoBlock />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
              <SidebarCard storageLabel={storageLabel} pct={pct} />
            </aside>
          </div>
        )}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-white/60 bg-white/50 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6 text-[#0f2744]" />
            </button>
            <span className="text-sm font-semibold text-[#0f2744]">BharatCloud Drive Pro</span>
          </header>
          <main className="flex-1 overflow-auto bg-transparent">{children}</main>
        </div>
      </div>
    </WorkspaceQuotaContext.Provider>
  );
}

function LogoBlock({ href = "/dashboard/drive" }: { href?: string }) {
  return (
    <Link href={href} className="block">
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/40">
          <Cloud className="h-5 w-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-white">BharatCloud</span>
          <span className="block text-xs font-medium text-blue-200">Drive Pro</span>
        </span>
      </span>
      <span className="mt-3 inline-flex rounded-full border border-cyan-200/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-cyan-100">
        HOSTED ON E2E • MUMBAI
      </span>
    </Link>
  );
}

function SidebarCard({
  storageLabel,
  pct,
}: {
  storageLabel: string;
  pct: number;
}) {
  return (
    <div className="mt-auto rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur-md">
      <Link
        href="/contact"
        className="flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-200"
      >
        <LifeBuoy className="h-4 w-4 text-blue-300" />
        Support
      </Link>
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/75">
          <span>Storage</span>
          <span className="font-medium text-white">{storageLabel}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-white/90">
        <span>Partner: Sahil Rana - Verified</span>
        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
      </p>
      <form action="/api/auth/logout" method="post" className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-400 bg-red-500/10 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </div>
  );
}

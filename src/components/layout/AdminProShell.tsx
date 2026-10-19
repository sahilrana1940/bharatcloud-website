"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CreditCard,
  HardDrive,
  LayoutDashboard,
  Mail,
  Menu,
  Shield,
  Sparkles,
  LogOut,
  Users,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { ProMeshBackground } from "@/components/ui/pro/primitives";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Command center", icon: LayoutDashboard, exact: true },
  { href: "/admin/payments", label: "UPI approvals", icon: CreditCard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/gmail", label: "Gmail access", icon: Mail },
  { href: "/admin/super", label: "Nexus metrics", icon: Sparkles, exact: true },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/recovery", label: "Recovery", icon: Shield },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
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
}

export function AdminProShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname.startsWith("/admin/platform")) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <ProMeshBackground />
      <div className="relative flex min-h-screen">
        <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white/90 p-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-black text-white">
              BC
            </span>
            <BrandMark titleClass="text-slate-900" accentClass="text-cyan-600" href="/admin" />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">Platform super admin</p>
          <nav className="mt-8 flex-1 space-y-1">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="mt-auto space-y-2 border-t border-slate-200 pt-4">
            <p className="text-[10px] leading-relaxed text-slate-400">
              Not a customer company login — BharatCloud operator only.
            </p>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </form>
          </div>
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
                <BrandMark titleClass="text-slate-900" accentClass="text-cyan-600" href="/admin" />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                  <X className="h-6 w-6 text-slate-700" />
                </button>
              </div>
              <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
                <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </nav>
              <form action="/api/auth/logout" method="post" className="border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </aside>
          </div>
        )}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-6 w-6 text-slate-700" />
              </button>
              <span className="text-sm font-semibold text-slate-800">BharatCloud Admin</span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-xs font-semibold text-slate-600">Log out</button>
            </form>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

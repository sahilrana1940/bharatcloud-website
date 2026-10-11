"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  HardDrive,
  LayoutDashboard,
  Shield,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { ProMeshBackground } from "@/components/ui/pro/primitives";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/super", label: "Nexus Super", icon: Sparkles },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/storage", label: "Storage", icon: HardDrive },
  { href: "/admin/recovery", label: "Recovery", icon: Shield },
  { href: "/dashboard/company-admin", label: "Company view", icon: Building2 },
];

export function AdminProShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = pathname === "/admin/super";

  if (fullBleed) {
    return (
      <div className="relative min-h-screen bg-slate-50 text-slate-900">
        <ProMeshBackground />
        <div className="relative">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <ProMeshBackground />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 p-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-black text-white">
              AD
            </span>
            <BrandMark titleClass="text-slate-900" accentClass="text-cyan-600" href="/admin" />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">Platform admin</p>
          <nav className="mt-8 flex-1 space-y-1">
            {links.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
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
          </nav>
          <Link href="/dashboard/drive" className="text-xs text-slate-500 hover:text-cyan-600">
            ← Back to workspace
          </Link>
        </aside>
        <main className="flex-1 overflow-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

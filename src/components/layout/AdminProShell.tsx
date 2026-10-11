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
    return <div className="min-h-screen bg-[#0A0A0B] text-white">{children}</div>;
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0B] text-white">
      <ProMeshBackground />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-black/20 p-5 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22D3EE] text-sm font-black text-slate-900">
              AD
            </span>
            <BrandMark titleClass="text-white" accentClass="text-[#22D3EE]" href="/admin" />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">Platform admin</p>
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
                      ? "bg-[#22D3EE]/20 text-[#22D3EE]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <l.icon className="h-4 w-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/dashboard/drive" className="text-xs text-white/40 hover:text-[#22D3EE]">
            ← Back to workspace
          </Link>
        </aside>
        <main className="flex-1 overflow-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

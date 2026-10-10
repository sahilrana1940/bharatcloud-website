"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cloud,
  CreditCard,
  Clock,
  HardDrive,
  Inbox,
  Share2,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard/drive", label: "Drive", icon: HardDrive },
  { href: "/dashboard/vault", label: "My Vault", icon: Shield },
  { href: "/dashboard/emails", label: "Emails", icon: Inbox },
  { href: "/dashboard/shared", label: "Shared with me", icon: Share2 },
  { href: "/dashboard/recent", label: "Recent", icon: Clock },
  { href: "/dashboard/trash", label: "Trash", icon: Trash2 },
  { href: "/dashboard/team", label: "Team", icon: User, admin: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
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
  const [usedGb, setUsedGb] = useState(4.3);
  const [limitGb, setLimitGb] = useState(50);

  useEffect(() => {
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
  }, []);

  const pct = Math.min(100, Math.round((usedGb / limitGb) * 100));

  return (
    <div className="flex min-h-screen bg-[#0A0E1A] text-slate-100">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-white/5 bg-[#0F1420] p-5 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20">
            <Cloud className="h-5 w-5 text-white" />
          </span>
          <BrandMark />
        </div>

        <nav className="mt-10 flex-1 space-y-1">
          {nav
            .filter((l) => !l.admin || role === "admin")
            .map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-gradient-to-r from-sky-600/90 to-cyan-500/80 text-white shadow-lg shadow-sky-500/15"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  <l.icon className="h-4 w-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-[#1E2639]/50 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-200">
                {userEmail.split("@")[0]}
              </p>
              <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
              {companyId && (
                <p className="truncate text-[9px] text-slate-600" title={companyId}>
                  Co. {companyId.startsWith("demo-") ? "demo" : companyId.slice(0, 8)}…
                </p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-slate-500">
              <span>Storage</span>
              <span>{usedGb}GB / {limitGb}GB</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

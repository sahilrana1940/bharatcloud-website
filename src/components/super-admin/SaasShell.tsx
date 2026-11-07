"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PLATFORM_NAME } from "@/lib/constants";
import { OWNER_EMAIL, WEBSITE } from "@/lib/super-admin/locked-spec";

const NAV = [
  { href: "/super-admin", label: "Command Center" },
  { href: "/super-admin/members", label: "Members" },
  { href: "/super-admin/billing", label: "Billing Cockpit" },
  { href: "/super-admin/mail", label: "Mail Control" },
  { href: "/super-admin/storage", label: "Storage & Logs" },
  { href: "/super-admin/settings", label: "Settings" },
];

export function SaasShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0c0e16] px-4 py-6">
          <p className="px-2 text-sm font-bold text-white">{PLATFORM_NAME}</p>
          <p className="mt-1 px-2 text-xs text-zinc-500">{WEBSITE}</p>
          <p className="mt-3 px-2 text-xs text-orange-300">{OWNER_EMAIL}</p>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.href === "/super-admin" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-orange-500 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10 px-6 py-4 md:px-8">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </header>
          <main className="px-6 py-8 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

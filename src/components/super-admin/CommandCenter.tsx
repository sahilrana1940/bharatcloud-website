"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/billing", label: "Billing" },
  { href: "/super-admin/infrastructure", label: "Infrastructure" },
  { href: "/super-admin/users", label: "Users" },
  { href: "/super-admin/logs", label: "Logs" },
];

export function CommandCenter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#050507] text-zinc-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-[#09090b] px-4 py-6">
        <p className="px-2 text-[11px] font-semibold tracking-[0.22em] text-zinc-500">COMMAND CENTER</p>
        <p className="mt-2 px-2 text-sm font-semibold text-white">support@bharatcloud.store</p>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}

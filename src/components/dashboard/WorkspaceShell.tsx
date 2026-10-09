"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/drive", label: "Drive" },
  { href: "/dashboard/my-vault", label: "My Vault" },
  { href: "/dashboard/emails", label: "Emails" },
  { href: "/dashboard/team", label: "Team", admin: true },
];

export function WorkspaceShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "member";
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0d12] dark:text-slate-100">
      <aside className="w-56 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <Link href="/" className="text-sm font-semibold">
          BharatCloud<span className="text-sky-500">.store</span>
        </Link>
        <nav className="mt-8 space-y-1">
          {links
            .filter((l) => !l.admin || role === "admin")
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm",
                  pathname === l.href
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
                )}
              >
                {l.label}
              </Link>
            ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

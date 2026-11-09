"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Shell({ title, role, children }: { title: string; role: string; children: ReactNode }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/product/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/enter");
    router.refresh();
  }
  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#1c1915]">
      <header className="flex items-center justify-between border-b border-[#e6dccb] bg-white px-4 py-3">
        <div>
          <Link href="/hub" className="font-bold">BharatCloud</Link>
          <p className="text-xs text-[#7a5b32]">{role}</p>
        </div>
        <button onClick={logout} className="text-sm font-semibold">Logout</button>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-5">{children}</div>
      </main>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-white p-4">
      <p className="text-xs text-[#7a5b32]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = {
  users: number;
  storageUsed: number;
  revenue: number;
  personal_users: Array<{
    email: string;
    plan: string;
    is_paid: boolean;
    is_blocked?: boolean;
  }>;
  tiers: { hot: number; cold: number; vault?: number };
  recovery: Array<{ id: string; user_email: string; contact_mail: string }>;
};

export function SuperAdminClient() {
  const [data, setData] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/super");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(email: string, action: string, plan?: string) {
    await fetch("/api/admin/super", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action, plan }),
    });
    load();
  }

  async function approveRecovery(id: string) {
    await fetch("/api/admin/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    load();
  }

  if (!data) return <p className="p-8 text-slate-400">Loading…</p>;

  const gb = (data.storageUsed / 1024 ** 3).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-bold">Super Admin</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-[#1E2639] p-4">Users: {data.users}</div>
        <div className="rounded-xl bg-[#1E2639] p-4">Storage: {gb} GB</div>
        <div className="rounded-xl bg-[#1E2639] p-4">Paid subs: {data.revenue}</div>
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Vault tiers — hot: {data.tiers.hot} · cold: {data.tiers.cold}
      </p>

      <h2 className="mt-8 font-semibold">Users</h2>
      <ul className="mt-2 space-y-2">
        {data.personal_users.map((u) => (
          <li key={u.email} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#1E2639] p-3 text-sm">
            <span className="flex-1">{u.email}</span>
            <span>{u.plan}</span>
            <button type="button" className="text-cyan-400" onClick={() => patch(u.email, "plan", "free")}>FREE</button>
            <button type="button" className="text-cyan-400" onClick={() => patch(u.email, "plan", "plus")}>199</button>
            <button type="button" className="text-cyan-400" onClick={() => patch(u.email, "plan", "pro")}>499</button>
            <button
              type="button"
              className="text-red-300"
              onClick={() => patch(u.email, u.is_blocked ? "unblock" : "block")}
            >
              {u.is_blocked ? "Unblock" : "Block"}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-semibold">Recovery</h2>
      <ul className="mt-2 space-y-2">
        {data.recovery.map((r) => (
          <li key={r.id} className="flex justify-between rounded-lg bg-[#1E2639] p-3 text-sm">
            <span>{r.user_email} → {r.contact_mail}</span>
            <button type="button" onClick={() => approveRecovery(r.id)} className="text-cyan-400">Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { INDIA_BADGE } from "@/lib/storage/tiers";


type Member = {
  email: string;
  name?: string;
  storage_used_gb?: number;
  drive_used_gb?: number;
  email_sync_status?: string;
  drive_sync_status?: string;
};

export function OwnerDashboardClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");
  const [storage, setStorage] = useState({ hot: "0", cold: "0", vault: "0" });

  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    setMembers(j.users || []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/company/storage")
      .then((r) => r.json())
      .then((j) => {
        if (j.hotGb) setStorage({ hot: j.hotGb, cold: j.coldGb, vault: j.vaultGb });
      })
      .catch(() => undefined);
  }, [load]);

  async function syncAll(type: "drive" | "gmail") {
    setMsg(type === "drive" ? "Syncing drives…" : "Syncing mail…");
    if (type === "drive") await fetch("/api/drive/sync", { method: "POST" });
    else await fetch("/api/gmail/sync", { method: "POST" });
    setMsg("Sync started");
    load();
  }

  const totalStorage = members.reduce(
    (s, m) => s + (m.storage_used_gb ?? m.drive_used_gb ?? 0),
    0,
  );

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Company Owner</h1>
      <p className="text-slate-500">Full access for your company domain</p>
      <p className="mt-1 text-[10px] text-slate-600">{INDIA_BADGE}</p>
      <p className="mt-2 text-sm text-slate-400">
        Hot {storage.hot}GB · Cold {storage.cold}GB · Vault {storage.vault}GB (7yr retention)
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#1E2639] p-5">
          <p className="text-xs text-slate-400">Employees</p>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1E2639] p-5">
          <p className="text-xs text-slate-400">Storage used</p>
          <p className="text-2xl font-bold text-white">{totalStorage.toFixed(1)} GB</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1E2639] p-5">
          <Link href="/dashboard/vault" className="text-cyan-400 text-sm font-semibold">
            Open company vault →
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => syncAll("drive")}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white"
        >
          Sync All Drives
        </button>
        <button
          type="button"
          onClick={() => syncAll("gmail")}
          className="rounded-xl border border-white/10 bg-[#1E2639] px-4 py-2 text-sm text-slate-200"
        >
          Sync All Mails
        </button>
        <Link href="/dashboard/team" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">
          Team settings
        </Link>
      </div>
      {msg && <p className="mt-2 text-sm text-cyan-400">{msg}</p>}

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
        <table className="w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Drive</th>
              <th className="px-4 py-3">Email sync</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-b border-white/5">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.name || "—"}</td>
                <td className="px-4 py-3 capitalize">{m.drive_sync_status || "idle"}</td>
                <td className="px-4 py-3 capitalize">{m.email_sync_status || "idle"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-[#1E2639] p-6">
        <h2 className="text-xl font-semibold text-white">Billing</h2>
        <p className="mt-2 text-sm text-slate-400">UPI subscription for your company</p>
        <Link
          href="/dashboard/billing"
          className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Open UPI billing →
        </Link>
      </div>
    </div>
  );
}

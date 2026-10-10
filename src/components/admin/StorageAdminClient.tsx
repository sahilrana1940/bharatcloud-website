"use client";

import { useCallback, useEffect, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";

type Stats = {
  hotGb: string;
  coldGb: string;
  vaultGb: string;
  costSavedInr: number;
};

export function StorageAdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [restoreId, setRestoreId] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/storage");
    const j = await res.json();
    if (res.ok) setStats(j);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function restore() {
    if (!restoreId.trim()) return;
    const res = await fetch("/api/admin/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backupId: restoreId.trim() }),
    });
    setToast(res.ok ? "Restored from vault to HOT" : "Restore failed");
    setTimeout(() => setToast(""), 3000);
    load();
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 pb-20 pt-8 text-slate-100 sm:px-8">
      <h1 className="text-3xl font-bold">Storage tiers</h1>
      <p className="text-slate-500">Hot / Cold / Vault — private buckets, signed URLs only</p>

      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-500/20 bg-[#1E2639] p-5">
            <p className="text-xs text-orange-300">Hot used</p>
            <p className="text-2xl font-bold">{stats.hotGb} GB</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-[#1E2639] p-5">
            <p className="text-xs text-sky-300">Cold used</p>
            <p className="text-2xl font-bold">{stats.coldGb} GB</p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-[#1E2639] p-5">
            <p className="text-xs text-violet-300">Vault used</p>
            <p className="text-2xl font-bold">{stats.vaultGb} GB</p>
          </div>
        </div>
      )}

      {stats && (
        <p className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          Cold storage se ₹{stats.costSavedInr}/month bacha (estimated)
        </p>
      )}

      <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-[#1E2639] p-5">
        <p className="text-sm font-semibold">Restore from Vault</p>
        <input
          value={restoreId}
          onChange={(e) => setRestoreId(e.target.value)}
          placeholder="personal_backups UUID"
          className="mt-3 w-full rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={restore}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-2.5 text-sm font-semibold text-white"
        >
          Restore from Vault
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        🇮🇳 Data in Mumbai — HOT/COLD encrypted vault. All buckets private; downloads expire in 60–120s.
      </p>
      <Toast message={toast} />
    </div>
  );
}

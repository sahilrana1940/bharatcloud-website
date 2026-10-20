"use client";

import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BackupOnboarding } from "@/components/dashboard/BackupOnboarding";
import { Toast } from "@/components/dashboard/Toast";
import { openUpgradePaymentLink } from "@/lib/billing/upgrade-pro";

type Member = {
  id: string;
  email: string;
  name?: string;
  drive_sync_status?: string | null;
  email_sync_status?: string | null;
  email_sync_progress?: string | null;
  storage_used_gb?: number;
  drive_used_gb?: number;
  drive_limit_gb?: number;
};

export function TeamPageClient({
  canManageTeam = false,
  userEmail = "",
}: {
  canManageTeam?: boolean;
  userEmail?: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState("");
  const [globalProgress, setGlobalProgress] = useState<string | null>(null);
  const [proActive, setProActive] = useState<boolean | null>(null);
  const [archivePending, setArchivePending] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    if (res.ok) {
      setMembers(j.users || []);
      setArchivePending(Boolean(j.archivePending));
    }
  }, []);

  const loadBilling = useCallback(async () => {
    const res = await fetch("/api/billing/status");
    const j = await res.json();
    if (res.ok) setProActive(Boolean(j.active));
  }, []);

  useEffect(() => {
    load();
    loadBilling();
    if (canManageTeam) {
      fetch("/api/domain/sync-team", { method: "POST" })
        .then(() => load())
        .catch(() => undefined);
    }
    const id = setInterval(() => {
      load();
      loadBilling();
    }, 4000);
    return () => clearInterval(id);
  }, [load, loadBilling, canManageTeam]);

  async function enableBackup(email: string) {
    notify(`Starting backup for ${email}…`);
    const res = await fetch("/api/backup/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    notify(res.ok ? `Backup job started (${j.filesDone ?? 0} files tick)` : j.error || "Failed");
    load();
  }

  async function upgradeToPro() {
    setUpgradeLoading(true);
    try {
      const result = await openUpgradePaymentLink({
        companyEmail: userEmail,
        plan: "pro",
      });
      notify(result.ok ? "Paytm checkout opened — complete payment to unlock Pro" : result.error);
    } finally {
      setUpgradeLoading(false);
    }
  }

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function syncDrive(email?: string) {
    notify(email ? `Drive sync started for ${email}` : "Syncing all drives…");
    setGlobalProgress("Backing up…");
    const res = await fetch("/api/drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { ownerEmail: email } : {}),
    });
    const j = await res.json();
    setGlobalProgress(null);
    notify(res.ok ? `Drive sync done (${j.filesBackedUp ?? "ok"})` : j.error || "Drive sync failed");
    load();
  }

  async function addUsers() {
    const email = addEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      notify("Enter a team email");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/team/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    setAdding(false);
    if (!res.ok) {
      notify(j.error || "Could not add member");
      return;
    }
    setAddEmail("");
    notify(`${email} added. Starting mail backup…`);
    await enableBackup(email);
    load();
  }

  const syncing = members.some((m) => m.drive_sync_status === "syncing");

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team &amp; backup</h1>
          <p className="text-slate-500">
            Google Drive archive + CCTV upload — central vault for your company
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {proActive === false && (
            <button
              type="button"
              disabled={upgradeLoading}
              onClick={() => upgradeToPro()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#10243E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Upgrade to Pro
            </button>
          )}
          {canManageTeam ? (
            <>
              <button
                type="button"
                onClick={() => syncDrive()}
                disabled={archivePending}
                className="flex items-center gap-2 rounded-xl bg-[#00BAF2] px-4 py-2.5 text-sm font-semibold text-[#062033] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" /> Sync All Drives
              </button>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="staff@company.com"
                className="h-10 rounded-xl border border-cyan-200 bg-white px-3 text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={addUsers}
                disabled={adding}
                className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-medium text-cyan-700 shadow-sm hover:bg-cyan-50 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" /> {adding ? "Adding…" : "Add member"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <BackupOnboarding userEmail={userEmail} />

      {(globalProgress || syncing) && (
        <div className="mt-6 rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-cyan-800">
            {globalProgress || "Drive sync in progress…"}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-sky-500 to-cyan-400" />
          </div>
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm text-slate-900">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Drive Status</th>
              <th className="px-4 py-3 font-medium">Storage Used</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No team members yet.
                </td>
              </tr>
            ) : null}
            {members.map((m) => {
              const used = m.storage_used_gb ?? m.drive_used_gb ?? 0;
              const rawLimit = m.drive_limit_gb ?? 0;
              const limit = !rawLimit || rawLimit === 15 ? 100 : rawLimit;
              return (
                <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.email}</td>
                  <td className="px-4 py-3 text-slate-700">{m.name || m.email.split("@")[0]}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{m.drive_sync_status || "idle"}</td>
                  <td className="px-4 py-3 text-slate-700">{used}GB / {limit}GB</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(canManageTeam || m.email === userEmail) && (
                        <button
                          type="button"
                          onClick={() => syncDrive(m.email)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Sync Drive
                        </button>
                      )}
                      {canManageTeam && (
                        <button
                          type="button"
                          onClick={() => enableBackup(m.email)}
                          className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F766E]/90"
                        >
                          Enable backup
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Toast message={toast} />
    </div>
  );
}

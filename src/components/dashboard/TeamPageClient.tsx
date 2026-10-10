"use client";

import { RefreshCw, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";

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

export function TeamPageClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState("");
  const [globalProgress, setGlobalProgress] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    if (res.ok) setMembers(j.users || []);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

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

  async function syncGmail(email?: string) {
    const q = email ? `?user=${encodeURIComponent(email)}` : "";
    notify(email ? `Gmail sync started for ${email}` : "Syncing all mailboxes…");
    setGlobalProgress("Backing up mail…");
    const res = await fetch(`/api/gmail/sync${q}`, { method: "POST" });
    const j = await res.json();
    setGlobalProgress(j.status === "started" ? "Sync running in background…" : null);
    notify(res.ok ? "Gmail sync started" : j.error || "Gmail sync failed");
    load();
  }

  async function addUsers() {
    const res = await fetch("/api/team/sync", { method: "POST" });
    const j = await res.json();
    notify(res.ok ? `Added/synced ${j.synced} users` : j.error || "Failed");
    load();
  }

  const syncing = members.some(
    (m) =>
      m.drive_sync_status === "syncing" ||
      m.email_sync_status === "syncing" ||
      (m.email_sync_progress && m.email_sync_progress.includes("/")),
  );
  const progressLine = members.find((m) => m.email_sync_progress)?.email_sync_progress;

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team</h1>
          <p className="text-slate-500">Manage backup for every workspace user</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => syncDrive()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" /> Sync All Drives
          </button>
          <button
            type="button"
            onClick={() => syncGmail()}
            className="rounded-xl border border-white/10 bg-[#1E2639] px-4 py-2.5 text-sm text-slate-200"
          >
            Sync All Mails
          </button>
          <button
            type="button"
            onClick={addUsers}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/40 px-4 py-2.5 text-sm text-cyan-300"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {(globalProgress || syncing || progressLine) && (
        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-[#1E2639] p-4">
          <p className="text-sm text-cyan-300">
            {globalProgress || (progressLine ? `Backing up ${progressLine}…` : "Sync in progress…")}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-sky-500 to-cyan-400" />
          </div>
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-[#1E2639]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Drive Status</th>
              <th className="px-4 py-3 font-medium">Email Status</th>
              <th className="px-4 py-3 font-medium">Storage Used</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const used = m.storage_used_gb ?? m.drive_used_gb ?? 0;
              const limit = m.drive_limit_gb ?? 15;
              return (
                <tr key={m.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-4 py-3">{m.email}</td>
                  <td className="px-4 py-3">{m.name || m.email.split("@")[0]}</td>
                  <td className="px-4 py-3 capitalize">{m.drive_sync_status || "idle"}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{m.email_sync_status || "idle"}</span>
                    {m.email_sync_progress ? (
                      <span className="ml-1 text-xs text-slate-500">({m.email_sync_progress})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{used}GB / {limit}GB</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => syncDrive(m.email)}
                        className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs text-blue-300"
                      >
                        Sync Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => syncGmail(m.email)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300"
                      >
                        Sync Gmail Now
                      </button>
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

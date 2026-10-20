"use client";

import { useEffect, useState } from "react";

import { AdminShell, BugFixPanel, FIX_BUTTONS } from "@/components/super-admin/AdminShell";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

type LogRow = {
  id: string;
  timestamp: string;
  emp?: string;
  action: string;
  details: string;
  status: string;
};

const PILL: Record<string, string> = {
  "System initialized": "bg-purple-500/20 text-purple-300",
  "Heartbeat check": "bg-blue-500/20 text-blue-300",
  "Cache cleared": "bg-orange-500/20 text-orange-300",
  "Tenant added": "bg-teal-500/20 text-teal-300",
};

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/super-admin/logs", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("403 Forbidden");
        if (!res.ok) throw new Error("Logs request failed");
        return res.json();
      })
      .then(setLogs)
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function undo(actionId: string) {
    const res = await fetch("/api/super-admin/recollect", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-admin-email": SUPER_ADMIN_EMAIL },
      body: JSON.stringify({ actionId }),
    });
    const data = await res.json();
    setNote(res.status === 403 ? "403 Forbidden" : String(data.message || ""));
    load();
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bharatcloud-logs.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell active="Logs">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-teal-300">BHARATCLOUD SUPER ADMIN</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">System Logs & Recollect History</h1>
        </div>
        <p className="text-xs text-emerald-400">SA {SUPER_ADMIN_EMAIL} REAL LIVE</p>
      </div>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-emerald-300">{note}</p> : null}

      <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">LOG HISTORY</h2>
            <span className="rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] text-emerald-400">Real</span>
            <span className="text-xs text-zinc-500">{logs.length} entries · 0 KB total</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111113] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Timestamp IST</th>
                  <th className="px-3 py-3">Emp</th>
                  <th className="px-3 py-3">Action type</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Undo</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-zinc-500">
                      No data yet - Real from Razorpay/E2E
                    </td>
                  </tr>
                ) : (
                  logs.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-800">
                      <td className="px-3 py-3">{row.timestamp}</td>
                      <td className="px-3 py-3 text-zinc-400">{row.emp || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${PILL[row.action] || "bg-zinc-800 text-zinc-300"}`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="px-3 py-3">{row.details}</td>
                      <td className="px-3 py-3 text-emerald-400">{row.status}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => undo(row.id)}
                          className="rounded-lg border border-teal-600 px-2 py-1 text-xs text-teal-300"
                        >
                          Undo
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
          <h2 className="text-sm font-semibold text-white">Recollect Controls</h2>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => logs[0] && undo(logs[0].id)}
              className="rounded-lg border border-orange-500 px-3 py-2 text-xs text-orange-300"
            >
              Undo Last Action
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/super-admin/fix", {
                  method: "POST",
                  cache: "no-store",
                  headers: { "Content-Type": "application/json", "x-admin-email": SUPER_ADMIN_EMAIL },
                  body: JSON.stringify({ type: "LOGS" }),
                });
                const data = await res.json();
                setNote(res.status === 403 ? "403 Forbidden" : String(data.message || ""));
                load();
              }}
              className="rounded-lg border border-red-500 px-3 py-2 text-xs text-red-300"
            >
              Clear All Logs
            </button>
            <button type="button" onClick={exportLogs} className="rounded-lg border border-teal-500 px-3 py-2 text-xs text-teal-300">
              Export Logs
            </button>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-500">Storage Used Logs</p>
            <p className="mt-1 text-sm text-white">0 KB / 5 GB</p>
            <div className="mt-2 h-2 rounded-full bg-zinc-800">
              <div className="h-full w-0 bg-teal-400" />
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[10px] tracking-widest text-teal-300">Bug Fix Panel ACTIVE</p>
        <BugFixPanel buttons={FIX_BUTTONS} />
      </div>
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";

type LogRow = {
  id: string;
  status: string | null;
  error_message: string | null;
  owner_email: string | null;
  updated_at: string | null;
};

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("Forbidden — support@bharatcloud.store only");
        if (!res.ok) throw new Error("Logs request failed");
        return res.json();
      })
      .then((data) => {
        setLogs(data.logs || []);
        setMessage(data.logs?.length ? "" : "No data yet - Real from Razorpay/E2E");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Logs</h1>
      <p className="mt-1 text-sm text-zinc-500">Failed backup jobs only. Empty means none are stored.</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-zinc-500">
                  No data yet - Real from Razorpay/E2E
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3 text-zinc-400">{row.updated_at || "—"}</td>
                  <td className="px-4 py-3">{row.owner_email || "—"}</td>
                  <td className="px-4 py-3">{row.status || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.error_message || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

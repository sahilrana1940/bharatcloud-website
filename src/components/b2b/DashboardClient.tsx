"use client";

import { useCallback, useEffect, useState } from "react";

type IdRow = {
  id: string;
  email_prefix: string;
  storage_used_gb: number;
  last_active_at: string;
};

type TrashRow = {
  id: string;
  original_name: string;
  deleted_at: string;
  file_key: string;
};

export function DashboardClient() {
  const [usedGb, setUsedGb] = useState(320);
  const [limitGb, setLimitGb] = useState(500);
  const [ids, setIds] = useState<IdRow[]>([]);
  const [trash, setTrash] = useState<TrashRow[]>([]);
  const [message, setMessage] = useState("");
  const [lastFileKey, setLastFileKey] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  const refresh = useCallback(async () => {
    const [storageRes, idsRes, trashRes] = await Promise.all([
      fetch("/api/b2b/storage"),
      fetch("/api/b2b/ids"),
      fetch("/api/b2b/trash"),
    ]);
    if (storageRes.ok) {
      const s = await storageRes.json();
      setUsedGb(s.usedGb);
      setLimitGb(s.limitGb);
    }
    if (idsRes.ok) {
      const j = await idsRes.json();
      setIds(j.ids || []);
    }
    if (trashRes.ok) {
      const t = await trashRes.json();
      setTrash(t.items || []);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createId() {
    const emailPrefix = prompt("Nayi ID email (e.g. hr@company.com)");
    if (!emailPrefix) return;
    const res = await fetch("/api/b2b/ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailPrefix }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.error || "Failed");
      return;
    }
    setMessage(`ID created: ${emailPrefix}`);
    refresh();
  }

  async function onUpload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/b2b/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.error || "Upload failed");
      return;
    }
    setLastFileKey(j.key);
    setMessage(`Uploaded: ${j.name}`);
    refresh();
  }

  async function onShare() {
    if (!lastFileKey) {
      setMessage("Upload a file first, then Share");
      return;
    }
    const res = await fetch("/api/b2b/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: lastFileKey }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.error || "Share failed");
      return;
    }
    setMessage(`7-day link copied`);
    await navigator.clipboard.writeText(j.url);
  }

  async function restore(trashId: string) {
    const res = await fetch("/api/b2b/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashId }),
    });
    const j = await res.json();
    setMessage(res.ok ? `Restored: ${j.restored || "ok"}` : j.error);
    refresh();
  }

  const pct = Math.min(100, Math.round((usedGb / limitGb) * 100));

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-lg font-medium text-gray-800">BharatCloud B2B</div>
        <div className="w-full max-w-md">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>{usedGb}GB / {limitGb}GB Used</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-normal text-gray-800">Company IDs</h1>
          <button
            type="button"
            onClick={createId}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            + Nayi ID Banao
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">ID Name</th>
                <th className="px-4 py-3 font-medium">Storage Used</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ids.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{row.email_prefix}</td>
                  <td className="px-4 py-3">{row.storage_used_gb}GB</td>
                  <td className="px-4 py-3">
                    {new Date(row.last_active_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => setMessage(`Manage ${row.email_prefix}`)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {ids.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No IDs yet — create one with &quot;Nayi ID Banao&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {message && (
          <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
            {message}
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
            Upload
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={onShare}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm hover:bg-gray-50"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => setShowTrash((v) => !v)}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm hover:bg-gray-50"
          >
            Wapas Lao
          </button>
        </div>

        {showTrash && (
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <h2 className="mb-3 font-medium">Deleted files (vault_trash)</h2>
            {trash.length === 0 ? (
              <p className="text-sm text-gray-500">No deleted files.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {trash.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2"
                  >
                    <span>
                      {t.original_name} ·{" "}
                      {new Date(t.deleted_at).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => restore(t.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

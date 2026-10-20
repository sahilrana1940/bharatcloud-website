"use client";

import { useState } from "react";

export function SyncAllDevicesButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function syncAll() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/company-admin/sync-devices", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Sync failed");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={syncAll}
        disabled={busy}
        className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Syncing…" : "Sync All & Sign All Device"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

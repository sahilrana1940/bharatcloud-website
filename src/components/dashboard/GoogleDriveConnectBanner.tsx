"use client";

import { Link2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function GoogleDriveConnectBanner() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/google-status");
    const j = await res.json();
    if (res.ok) {
      setConnected(Boolean(j.connected));
      setOauthConfigured(j.oauthConfigured !== false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (connected === null) return null;
  async function syncMyDrive() {
    const res = await fetch("/api/drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const j = await res.json();
    alert(res.ok ? `Sync done (${j.filesBackedUp ?? "ok"} files)` : j.error || "Sync failed");
  }

  if (connected) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        <p>Google Drive linked. Back up copies to <strong>BharatCloud Safe Drive</strong> below.</p>
        <button
          type="button"
          onClick={() => syncMyDrive()}
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Sync my Google Drive now
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="font-medium text-amber-100">Backup Google Drive (6 saal ka data)</p>
        <p className="mt-1 text-sm text-amber-200/80">
          {oauthConfigured
            ? "Connect the same Google account as your work email. No Team page needed."
            : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy."}
        </p>
      </div>
      {oauthConfigured ? (
        <a
          href="/api/auth/google/connect?returnTo=%2Fdashboard%2Fdrive%3Fgoogle%3Dconnected"
          className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white sm:mt-0"
        >
          <Link2 className="h-4 w-4" /> Connect Google Drive
        </a>
      ) : null}
    </div>
  );
}

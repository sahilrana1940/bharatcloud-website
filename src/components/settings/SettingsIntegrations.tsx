"use client";

import { Check, HardDrive, Loader2, Unlink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function SettingsIntegrations() {
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/google/drive/status");
    const j = await res.json();
    if (res.ok) {
      setConnected(Boolean(j.connected));
      setGoogleEmail(j.googleEmail || null);
      setOauthConfigured(j.oauthConfigured !== false);
    }
  }, []);

  useEffect(() => {
    load();
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const drive = p.get("drive");
    if (drive === "connected") {
      setMessage("Google Drive connected successfully.");
      window.history.replaceState({}, "", "/settings");
      load();
    } else if (drive === "error") {
      setMessage(p.get("reason") || "Google connection failed.");
      window.history.replaceState({}, "", "/settings");
    }
  }, [load]);

  async function connectDrive() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/google/drive/url");
      const j = await res.json();
      if (!res.ok || !j.url) {
        setMessage(j.error || "Could not start Google OAuth");
        return;
      }
      const popup = window.open(
        j.url,
        "google_drive_oauth",
        "width=520,height=720,menubar=no,toolbar=no",
      );
      const poll = window.setInterval(async () => {
        if (popup?.closed) window.clearInterval(poll);
        const st = await fetch("/api/auth/google/drive/status");
        const data = await st.json();
        if (data.connected) {
          window.clearInterval(poll);
          popup?.close();
          setConnected(true);
          setGoogleEmail(data.googleEmail);
          setMessage("Google Drive connected.");
        }
      }, 2000);
    } finally {
      setBusy(false);
    }
  }

  async function disconnectDrive() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/google/drive/disconnect", { method: "POST" });
      if (res.ok) {
        setConnected(false);
        setGoogleEmail(null);
        setMessage("Google Drive disconnected.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1E2639] p-6">
      <h2 className="text-lg font-semibold text-white">Integrations</h2>
      <p className="mt-1 text-sm text-slate-400">
        Connect Google Drive once — no OAuth Playground or manual refresh tokens.
      </p>

      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0F1420] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
            <HardDrive className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-slate-100">Google Drive</p>
            {connected ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-400">
                <Check className="h-4 w-4" />
                Connected{googleEmail ? ` as ${googleEmail}` : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Not connected</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {connected ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => disconnectDrive()}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" /> Disconnect
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !oauthConfigured}
              onClick={() => connectDrive()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {!oauthConfigured && (
        <p className="mt-4 text-sm text-amber-300">
          Set <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and{" "}
          <code>GOOGLE_REDIRECT_URI</code> (…/api/auth/google/drive/callback) on Vercel.
        </p>
      )}
      {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
    </section>
  );
}

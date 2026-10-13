"use client";

import { Check, HardDrive, Loader2, Unlink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const fetchOpts: RequestInit = { credentials: "include" };

export function SettingsIntegrations() {
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/google/drive/status", fetchOpts);
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
      const returnTo = encodeURIComponent("/settings?drive=connected");
      const res = await fetch(
        `/api/auth/google/drive/url?gmail=1&returnTo=${returnTo}`,
        fetchOpts,
      );
      const j = await res.json();
      if (!res.ok || !j.url) {
        setMessage(j.error || "Could not start Google OAuth");
        setBusy(false);
        return;
      }
      // Full-page redirect (more reliable than popup on Windows / COOP).
      window.location.href = j.url;
    } catch {
      setMessage("Network error starting Google sign-in.");
      setBusy(false);
    }
  }

  async function disconnectDrive() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/google/drive/disconnect", {
        method: "POST",
        ...fetchOpts,
      });
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
        Connect Google Drive + Gmail with your <strong>work email</strong> (same as login). No OAuth
        Playground.
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
          <code>GOOGLE_REDIRECT_URI</code> must match Google Console — usually
          <code>/api/auth/google/drive/callback</code> or legacy{" "}
          <code>/api/auth/callback/google</code>.
        </p>
      )}
      {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
    </section>
  );
}

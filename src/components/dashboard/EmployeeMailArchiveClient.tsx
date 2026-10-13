"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CloudUpload, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ArchiveRow = {
  id: string;
  file_name: string;
  subject?: string;
  from_email?: string;
  message_date?: string;
  owner_email?: string;
  size?: number;
};

type Status = {
  googleConnected?: boolean;
  status?: string;
  progress?: string;
  lastError?: string;
  archivedCount?: number;
  companyEmailArchiveCount?: number;
};

const fetchOpts: RequestInit = { credentials: "include" };

export function EmployeeMailArchiveClient({ userEmail }: { userEmail: string }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>({});
  const [googleConnected, setGoogleConnected] = useState(false);
  const [items, setItems] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [forwardId, setForwardId] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardMsg, setForwardMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const [archRes, gsRes] = await Promise.all([
        fetch("/api/archive/email", fetchOpts),
        fetch("/api/team/google-status", fetchOpts),
      ]);
      const arch = await archRes.json().catch(() => ({}));
      const gs = await gsRes.json().catch(() => ({}));

      if (!archRes.ok) {
        setError(arch.error || `Archive status error ${archRes.status}`);
      } else {
        setStatus(arch);
        setError("");
      }

      const connected =
        Boolean(arch.googleConnected) || Boolean(gs.connected);
      setGoogleConnected(connected);

      if (arch.lastError || (arch.status === "error" && arch.progress)) {
        setError(String(arch.lastError || arch.progress));
      }
    } catch {
      setError("Network error loading Gmail status");
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/employee/mail", fetchOpts);
      const j = await res.json().catch(() => ({}));
      if (res.ok) setItems(j.items || []);
      else if (res.status === 403) {
        setError(
          "Forbidden — run: fetch('/api/auth/refresh-workspace',{method:'POST'}).then(()=>location.reload())",
        );
      } else if (!error) setError(j.error || "Could not load archive");
    } catch {
      setError("Network error loading messages");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStatus(), loadList()]);
    setLoading(false);
  }, [loadStatus, loadList]);

  useEffect(() => {
    const drive = searchParams.get("drive");
    const reason = searchParams.get("reason");
    if (drive === "error" && reason) {
      setError(decodeURIComponent(reason));
    }
    if (drive === "connected") {
      setGoogleConnected(true);
    }
    refresh();
  }, [searchParams, refresh]);

  async function connectGmail() {
    setError("");
    const res = await fetch(
      `/api/auth/google/drive/url?gmail=1&returnTo=${encodeURIComponent("/dashboard/employee/mail")}`,
      fetchOpts,
    );
    const j = await res.json().catch(() => ({}));
    if (j.url) {
      window.location.href = j.url;
      return;
    }
    setError(j.error || "Google OAuth not configured on server");
  }

  async function startEmailBackup() {
    setSyncing(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/archive/email", { method: "POST", ...fetchOpts });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Backup failed — reconnect Gmail with all scopes");
        return;
      }
      const n = Number(j.count ?? 0);
      setSuccessMsg(
        n > 0
          ? `Done — archived ${n} message${n === 1 ? "" : "s"} to the company vault.`
          : "Backup finished — no messages found in this Gmail inbox (or they were already archived).",
      );
      await refresh();
    } catch {
      setError("Network error — try again or check your connection.");
    } finally {
      setSyncing(false);
    }
  }

  async function submitForward() {
    if (!forwardId || !forwardTo.trim()) return;
    const res = await fetch("/api/emails/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...fetchOpts,
      body: JSON.stringify({ emailId: forwardId, to: forwardTo.trim() }),
    });
    const j = await res.json();
    setForwardMsg(res.ok ? j.message || "Sent" : j.error || "Forward failed");
    if (res.ok) {
      setForwardId(null);
      setForwardTo("");
    }
  }

  const progressPct =
    status.progress && status.progress.includes("/")
      ? Math.min(
          100,
          Math.round(
            (Number(status.progress.split("/")[0]) /
              Math.max(1, Number(status.progress.split("/")[1]))) *
              100,
          ),
        )
      : status.status === "completed"
        ? 100
        : 0;

  return (
    <div className="min-h-screen overflow-y-auto px-4 pb-24 pt-6 sm:px-8">
      <div className="flex items-center gap-2">
        <Mail className="h-7 w-7 text-cyan-600" />
        <h1 className="text-2xl font-bold text-slate-900">My mail archive</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Signed in as <strong>{userEmail}</strong> — archived mail goes to the{" "}
        <strong>central company vault</strong> (same tenant as Drive backups and CCTV uploads).
      </p>

      {successMsg && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMsg}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {!googleConnected ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-slate-900">Connect Gmail to start email backup</p>
          <p className="mt-1 text-sm text-slate-600">
            Use your work account ({userEmail}). Allow <strong>Drive + Gmail</strong> on the Google
            screen.
          </p>
          <Button type="button" className="mt-4" onClick={connectGmail}>
            Connect Gmail
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Google connected</p>
          <Button
            type="button"
            disabled={syncing}
            className="mt-3 gap-2"
            onClick={startEmailBackup}
          >
            <CloudUpload className="h-4 w-4" />
            {syncing ? "Archiving…" : "Start my email backup"}
          </Button>
          {(syncing || status.status === "syncing") && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {status.progress || "Syncing…"}
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Archived: {status.archivedCount ?? 0} (you) · Company total:{" "}
            {status.companyEmailArchiveCount ?? 0}
          </p>
        </div>
      )}

      {forwardMsg && (
        <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {forwardMsg}
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Archived messages</h2>
      {loading ? (
        <p className="mt-4 text-slate-500">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">
                {e.subject || e.file_name || "(no subject)"}
              </p>
              <p className="text-xs text-slate-500">
                {e.from_email} ·{" "}
                {e.message_date ? new Date(e.message_date).toLocaleString() : "—"}
              </p>
              {forwardId === e.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Input
                    type="email"
                    value={forwardTo}
                    onChange={(ev) => setForwardTo(ev.target.value)}
                    placeholder="Forward to…"
                    className="max-w-xs"
                  />
                  <Button type="button" size="sm" onClick={submitForward}>
                    Send via company mail
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForwardId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1"
                  onClick={() => {
                    setForwardId(e.id);
                    setForwardTo("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> Forward from company mail
                </Button>
              )}
            </li>
          ))}
          {!items.length && (
            <li className="text-sm text-slate-500">
              {googleConnected
                ? "No archived mail yet — tap Start my email backup."
                : "Connect Gmail first, then run backup."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

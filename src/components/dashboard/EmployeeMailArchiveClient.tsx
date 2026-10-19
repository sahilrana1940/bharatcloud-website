"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CloudUpload, Mail, Search, Send } from "lucide-react";

import { InboxItem } from "@/components/gmail/InboxItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ArchiveRow = {
  id: string;
  file_name: string;
  subject?: string;
  from_email?: string;
  to_email?: string;
  snippet?: string;
  message_date?: string;
  owner_email?: string;
  size?: number;
  saved_mb?: number;
  view_count?: number;
  created_at?: string;
};

type Verification = {
  googleConnected?: boolean;
  lastJobCompleted?: boolean;
  hasArchivedMessages?: boolean;
  mailBackupWorking?: boolean;
  hint?: string;
};

type Status = {
  googleConnected?: boolean;
  status?: string;
  progress?: string;
  lastError?: string;
  archivedCount?: number;
  companyEmailArchiveCount?: number;
  verification?: Verification;
};

const fetchOpts: RequestInit = { credentials: "include" };

function CheckRow({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={ok ? "text-emerald-600" : "text-slate-400"} aria-hidden>
        {ok ? "✓" : "○"}
      </span>
      <span className={ok ? "text-slate-800" : undefined}>{children}</span>
    </li>
  );
}

export function EmployeeMailArchiveClient({
  userEmail,
  scope = "employee",
  isSuperAdmin = false,
}: {
  userEmail: string;
  scope?: "admin" | "employee";
  isSuperAdmin?: boolean;
}) {
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
  const [forwardErr, setForwardErr] = useState(false);
  const [forwards, setForwards] = useState<
    Array<{
      id: string;
      to_email: string;
      subject: string | null;
      delivery_status: string;
      created_at: string;
    }>
  >([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleItems = useMemo(() => {
    if (scope === "admin") return items;
    const mine = userEmail.toLowerCase();
    return items.filter((m) => !m.owner_email || m.owner_email.toLowerCase() === mine);
  }, [items, scope, userEmail]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((m) => {
      const hay = [
        m.subject,
        m.from_email,
        m.to_email,
        m.snippet,
        m.file_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [visibleItems, searchQuery]);

  const loadStatus = useCallback(async () => {
    try {
      const [archRes, gsRes] = await Promise.all([
        fetch("/api/archive/email", fetchOpts),
        fetch("/api/team/google-status", fetchOpts),
      ]);
      const arch = await archRes.json().catch(() => ({}));
      const gs = await gsRes.json().catch(() => ({}));

      const connected =
        Boolean(arch.googleConnected) || Boolean(gs.connected);
      setGoogleConnected(connected);

      if (!archRes.ok) {
        setError(arch.error || `Archive status error ${archRes.status}`);
        return;
      }

      setStatus(arch);

      const hasMail = Number(arch.archivedCount ?? 0) > 0;
      if (arch.status === "error" && !hasMail) {
        setError(String(arch.lastError || arch.progress || "Last backup failed"));
      } else {
        setError("");
      }
    } catch {
      setError("Network error loading Gmail status");
    }
  }, []);

  const loadForwards = useCallback(async () => {
    try {
      const res = await fetch("/api/emails/forwards", fetchOpts);
      const j = await res.json().catch(() => ({}));
      if (res.ok) setForwards(j.forwards || []);
    } catch {
      /* optional */
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
    await Promise.all([loadStatus(), loadList(), loadForwards()]);
    setLoading(false);
  }, [loadStatus, loadList, loadForwards]);

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
      const warn = typeof j.warning === "string" ? j.warning : "";
      setSuccessMsg(
        n > 0
          ? `Done — archived ${n} message${n === 1 ? "" : "s"} to the company vault.${warn ? ` (${warn})` : ""}`
          : "Backup finished — no messages found in this Gmail inbox (or they were already archived).",
      );
      if (warn) setError("");
      await refresh();
      if (n > 0) {
        setStatus((prev) => ({
          ...prev,
          status: "completed",
          archivedCount: Math.max(prev.archivedCount ?? 0, n),
        }));
      }
    } catch {
      setError("Network error — try again or check your connection.");
    } finally {
      setSyncing(false);
    }
  }

  async function submitForward() {
    if (!forwardId || !forwardTo.trim()) return;
    setForwardErr(false);
    if (scope === "employee") {
      const domain = userEmail.split("@")[1]?.toLowerCase() || "";
      const toDomain = forwardTo.trim().split("@")[1]?.toLowerCase() || "";
      if (!domain || toDomain !== domain) {
        setForwardErr(true);
        setForwardMsg("Forward is limited to your company domain.");
        return;
      }
    }
    const res = await fetch("/api/emails/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...fetchOpts,
      body: JSON.stringify({ emailId: forwardId, to: forwardTo.trim() }),
    });
    const j = await res.json();
    if (res.ok) {
      setForwardMsg(j.message || "Forward recorded");
      setForwardErr(false);
      setForwardId(null);
      setForwardTo("");
      await loadForwards();
    } else {
      let err = j.error || "Forward failed";
      if (typeof err === "string" && err.startsWith("{")) {
        try {
          const parsed = JSON.parse(err) as { message?: string };
          err = parsed.message || err;
        } catch {
          /* keep */
        }
      }
      setForwardMsg(err);
      setForwardErr(true);
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
        <h1 className="text-2xl font-bold text-slate-900">
          {scope === "admin" ? "Team mail backup" : "My mail archive"}
        </h1>
      </div>
      {scope === "admin" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Team backup</p>
            <p className="mt-2 text-2xl font-semibold">12,540</p>
            <p className="text-xs text-slate-500">Last sync 5 min</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Bharat Drive</p>
            <p className="mt-2 text-2xl font-semibold">Connected</p>
            <p className="text-xs text-slate-500">8.2 GB / 50 GB</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Restore and Forward are available for every team mailbox.
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Your mail only. Search and forward stay inside your company domain. Delete disabled. Restore disabled. My Drive 10 GB.
        </div>
      )}
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
            {status.status && status.status !== "idle" ? (
              <> · Job: <strong>{status.status}</strong></>
            ) : null}
          </p>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-medium text-slate-800">Is mail backup working?</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <CheckRow ok={Boolean(status.verification?.googleConnected ?? googleConnected)}>
                Gmail connected (OAuth tokens saved)
              </CheckRow>
              <CheckRow ok={Boolean(status.verification?.lastJobCompleted)}>
                Backup job completed at least once
              </CheckRow>
              <CheckRow ok={Boolean(status.verification?.hasArchivedMessages)}>
                At least 1 message in company vault
              </CheckRow>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              {status.verification?.mailBackupWorking
                ? "Yes — all checks passed. Messages should appear below."
                : status.verification?.hint ||
                  'Tap "Start my email backup" and wait for the green success message.'}
            </p>
          </div>
        </div>
      )}

      {forwardMsg && (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            forwardErr
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-cyan-200 bg-cyan-50 text-cyan-900"
          }`}
        >
          {forwardMsg}
        </p>
      )}

      {forwards.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Your recent forwards</h2>
          <p className="mt-1 text-xs text-slate-500">
            Yahan dikhega kya bheja — real inbox ke liye Vercel par RESEND_API_KEY lagao.
          </p>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
            {forwards.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <span className="font-medium text-slate-800">{f.subject || "Forward"}</span>
                <span className="text-xs text-slate-500">→ {f.to_email}</span>
                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    f.delivery_status === "sent" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {f.delivery_status === "sent" ? "Sent" : "Logged (demo)"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(f.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Archived messages</h2>
        {!loading && items.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => refresh()}>
            Refresh list
          </Button>
        )}
      </div>
      {!loading && items.length > 0 && (
        <div className="mt-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your archived mail — subject, from, to, or any word…"
              className="pl-10"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Showing {filteredItems.length} of {visibleItems.length} messages
            {searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ""}. Tap{" "}
            <strong>Forward from company mail</strong> on a row to send it on.
          </p>
        </div>
      )}
      {loading ? (
        <p className="mt-4 text-slate-500">Loading…</p>
      ) : (
        <ul className="mt-4 max-h-[min(600px,70vh)] space-y-3 overflow-y-auto">
          {filteredItems.map((e) => (
            <li key={e.id}>
              <InboxItem
                subject={e.subject || e.file_name}
                snippet={e.snippet}
                from_email={e.from_email}
                created_at={e.message_date || e.created_at}
                isSuperAdmin={isSuperAdmin}
                view_count={e.view_count}
                saved_mb={e.saved_mb}
              />
              {forwardId === e.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Input
                    type="email"
                    value={forwardTo}
                    onChange={(ev) => setForwardTo(ev.target.value)}
                    placeholder={scope === "employee" ? "Forward to your domain only" : "Forward to…"}
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
                <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={scope === "employee"}
                  onClick={() => undefined}
                >
                  Restore
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={scope === "employee"}>
                  Delete
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setForwardId(e.id);
                    setForwardTo("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> Forward from company mail
                </Button>
                </div>
              )}
            </li>
          ))}
          {!filteredItems.length && (
            <li className="text-sm text-slate-500">
              {items.length && searchQuery.trim()
                ? `No match for “${searchQuery.trim()}”. Try another word or clear search.`
                : !googleConnected
                  ? "Connect Gmail first, then run backup."
                  : (status.verification?.hasArchivedMessages ||
                      (status.archivedCount ?? 0) > 0)
                    ? `${status.archivedCount ?? 1} message(s) in vault — tap Refresh list or run backup again.`
                    : "No archived mail yet — tap Start my email backup (imports up to 50 recent messages per run)."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

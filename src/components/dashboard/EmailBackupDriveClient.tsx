"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Settings } from "lucide-react";

type BackupRun = {
  id: string;
  backup_date: string;
  email_count: number;
  size_mb: number | null;
  s3_bucket: string;
  s3_path: string | null;
  status: string;
  progress?: string;
};

const fetchOpts: RequestInit = { credentials: "include" };

export function EmailBackupDriveClient({ userEmail }: { userEmail: string }) {
  const [connected, setConnected] = useState(false);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [backedUpCount, setBackedUpCount] = useState(0);
  const [bucket, setBucket] = useState("bharatcloudfinal2");
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orgTotals, setOrgTotals] = useState<{
    totalEmails: number;
    totalMb: number;
    runCount: number;
  } | null>(null);

  const load = useCallback(async () => {
    const [gs, backup] = await Promise.all([
      fetch("/api/team/google-status", fetchOpts).then((r) => r.json()),
      fetch("/api/email/backup?org=1", fetchOpts).then((r) => r.json()),
    ]);
    setConnected(Boolean(gs.connected));
    setRuns(backup.runs || []);
    setBackedUpCount(Number(backup.backedUpCount) || 0);
    setBucket(backup.bucket || "bharatcloudfinal2");
    setProgress(backup.progress || "");
    setStatus(backup.status || "idle");
    setOrgTotals(backup.orgTotals || null);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load backup status"));
  }, [load]);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => {
      load().catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [status, load]);

  async function backupNow() {
    setBusy(true);
    setError("");
    setProgress("Fetching up to 100 emails…");
    try {
      const res = await fetch("/api/email/backup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxMessages: 100 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Backup failed");
        return;
      }
      setProgress(j.progress || "Backup complete");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function restore(runId: string) {
    setError("");
    const res = await fetch("/api/email/restore", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Restore failed");
      return;
    }
    window.alert(j.message || "Restore info ready — check bucket path in response.");
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Email Backup Drive</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#10243E] sm:text-3xl">
        Never lose emails when Google 120GB is full
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Full Gmail snapshots land in E2E Mumbai ({bucket}) as .eml files — outside Google quota.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Mail className="h-5 w-5 text-[#00BAF2]" />
          <span className="text-sm text-slate-700">
            Connected Gmail: <strong>{userEmail}</strong>
          </span>
          <span className="text-sm text-slate-500">|</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            {connected ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Status: Connected
              </>
            ) : (
              <>
                Status: Not connected —{" "}
                <Link href="/settings" className="text-[#00BAF2] underline">
                  Connect Gmail
                </Link>
              </>
            )}
          </span>
        </div>

        <button
          type="button"
          disabled={busy || !connected}
          onClick={backupNow}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00BAF2] px-5 py-3 text-sm font-bold text-[#062033] shadow-lg shadow-[#00BAF2]/25 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Backup Now to E2E Mumbai
        </button>

        {(progress || status === "running") && (
          <p className="mt-4 text-sm text-slate-600">
            {progress ||
              `Fetching up to 1000 emails → Uploading to ${bucket}/emails/…`}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {orgTotals && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Org email backups" value={String(orgTotals.runCount)} />
          <Stat label="Emails archived (org)" value={String(orgTotals.totalEmails)} />
          <Stat
            label={`Storage (${bucket})`}
            value={`${orgTotals.totalMb.toFixed(1)} MB`}
          />
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#10243E]">Last backups</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Emails</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Bucket</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    {new Date(r.backup_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{r.email_count ?? 0}</td>
                  <td className="px-4 py-3">
                    {r.size_mb != null ? `${Number(r.size_mb).toFixed(2)} MB` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.s3_bucket || bucket}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => restore(r.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No backups yet — {backedUpCount} / 10000 backed up overall.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-[#10243E]/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#10243E]">
          <Settings className="h-4 w-4" /> Settings
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Auto backup daily at 2 AM IST (Vercel cron)</li>
          <li>Keep 1 year archive on E2E Mumbai</li>
          <li>Cost: Included in plan (100GB/user + unlimited email archive)</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#10243E]">{value}</p>
    </div>
  );
}

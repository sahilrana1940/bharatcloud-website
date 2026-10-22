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

type FileArchive = {
  id: string;
  file_name: string;
  s3_bucket: string;
  s3_key: string;
  storage_class: string;
  archived_at: string;
  source: string | null;
  size_mb: number | null;
  is_from_start: boolean;
};

const fetchOpts: RequestInit = { credentials: "include" };

export function EmailBackupDriveClient({ userEmail }: { userEmail: string }) {
  const [connected, setConnected] = useState(false);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [archives, setArchives] = useState<FileArchive[]>([]);
  const [backedUpCount, setBackedUpCount] = useState(0);
  const [bucket, setBucket] = useState("bharatcloudfinal2");
  const [storageClass, setStorageClass] = useState("GLACIER");
  const [totalArchiveGb, setTotalArchiveGb] = useState(0);
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [gs, backup] = await Promise.all([
      fetch("/api/team/google-status", fetchOpts).then((r) => r.json()),
      fetch("/api/email/backup?org=1", fetchOpts).then((r) => r.json()),
    ]);
    setConnected(Boolean(gs.connected));
    setRuns(backup.runs || []);
    setArchives(backup.archives || []);
    setBackedUpCount(Number(backup.backedUpCount) || 0);
    setBucket(backup.bucket || "bharatcloudfinal2");
    setStorageClass(backup.storageClass || "GLACIER");
    setTotalArchiveGb(Number(backup.totalArchiveGb) || 0);
    setProgress(backup.progress || "");
    setStatus(backup.status || "idle");
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load archive status"));
  }, [load]);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => {
      load().catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [status, load]);

  async function archiveNow() {
    setBusy(true);
    setError("");
    setProgress("Fetching emails for archive copy…");
    try {
      const res = await fetch("/api/email/backup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxMessages: 100 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Archive failed");
        return;
      }
      setProgress(j.progress || "Archive complete");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function restore(archiveId: string) {
    setError("");
    const res = await fetch("/api/email/restore", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archiveId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Restore failed");
      return;
    }
    if (j.downloadUrl) {
      window.open(j.downloadUrl, "_blank", "noopener,noreferrer");
    } else {
      window.alert(j.message || "Restore logged — check E2E bucket.");
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Archive Drive</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#10243E] sm:text-3xl">
        All data archived from Day 1
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Hostinger app · E2E Mumbai · Paytm plan. Every Gmail message is copied to archive storage —
        originals stay in Gmail; BharatCloud keeps the long-term copy on E2E.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Archive location" value={`E2E ${bucket}`} sub={`Class: ${storageClass}`} />
        <InfoCard label="Retention" value="7 years minimum" sub="Archiver from start" />
        <InfoCard label="From start" value="Yes" sub="Every file from first day" />
        <InfoCard label="Total archived" value={`${totalArchiveGb.toFixed(2)} GB`} sub="In bharatcloudfinal2" />
      </div>

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
          onClick={archiveNow}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00BAF2] px-5 py-3 text-sm font-bold text-[#062033] shadow-lg shadow-[#00BAF2]/25 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Archive Now
        </button>

        {(progress || status === "running") && (
          <p className="mt-4 text-sm text-slate-600">{progress}</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#10243E]">Archive index (file_archives)</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Archived</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {archives.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{new Date(a.archived_at).toLocaleString()}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">{a.file_name}</td>
                  <td className="px-4 py-3 capitalize">{a.source || "—"}</td>
                  <td className="px-4 py-3">
                    {a.size_mb != null ? `${Number(a.size_mb).toFixed(2)} MB` : "—"}
                  </td>
                  <td className="px-4 py-3">{a.storage_class}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => restore(a.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {!archives.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No archive rows yet — {backedUpCount.toLocaleString()} emails in past runs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-[#10243E]">Gmail archive runs</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Emails</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Bucket</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{new Date(r.backup_date).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.email_count ?? 0}</td>
                  <td className="px-4 py-3">
                    {r.size_mb != null ? `${Number(r.size_mb).toFixed(2)} MB` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.s3_bucket || bucket}</td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-[#10243E]/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#10243E]">
          <Settings className="h-4 w-4" /> Archiver policy
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Auto archive daily at 2 AM IST on Hostinger</li>
          <li>7-year minimum retention on E2E Mumbai ({storageClass})</li>
          <li>Included in Paytm plan — archive forever, not hot storage</li>
        </ul>
      </section>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#10243E]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

"use client";

import { Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { BackupValueStrip } from "@/components/dashboard/BackupValueStrip";

function formatGb(bytes: number) {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function BackupOnboarding({ userEmail }: { userEmail: string }) {
  const [oauthConfigured, setOauthConfigured] = useState(true);
  const [s3Ok, setS3Ok] = useState(true);
  const [paid, setPaid] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [filesDone, setFilesDone] = useState(0);
  const [bytesCompressed, setBytesCompressed] = useState(0);
  const [bytesOriginal, setBytesOriginal] = useState(0);
  const [savedPct, setSavedPct] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [cfg, g, pay, sum] = await Promise.all([
      fetch("/api/config/public").then((r) => r.json()),
      fetch("/api/team/google-status").then((r) => r.json()),
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/backup/summary").then((r) => r.json()),
    ]);
    setOauthConfigured(cfg.googleOAuthConfigured !== false);
    setS3Ok(cfg.s3Configured !== false);
    setGoogleLinked(Boolean(g.connected));
    const payments = pay.payments || [];
    setPaid(
      payments.some((p: { status: string }) =>
        ["approved", "paid", "active"].includes(p.status),
      ),
    );
    if (sum.jobStatus === "running" || sum.jobStatus === "queued") {
      setJobStatus(String(sum.jobStatus));
      setFilesDone(sum.filesDone || 0);
    }
    if (sum.filesArchived > 0 && sum.jobStatus === "completed") {
      setJobStatus("completed");
      setFilesDone(sum.filesArchived);
    }
    setBytesCompressed(sum.bytesCompressed || 0);
    setBytesOriginal(sum.bytesOriginal || 0);
    setSavedPct(sum.savedPct || 0);
  }, []);

  const runTick = useCallback(async () => {
    const res = await fetch("/api/backup/tick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const j = await res.json();
    if (j.status) setJobStatus(String(j.status));
    if (j.filesDone) setFilesDone(j.filesDone);
    if (j.bytesCompressed) setBytesCompressed(j.bytesCompressed);
    if (j.bytesOriginal) setBytesOriginal(j.bytesOriginal);
    if (j.savedPct) setSavedPct(j.savedPct);
    if (j.done) {
      if (tickRef.current) clearInterval(tickRef.current);
      setJobStatus("completed");
    }
  }, []);

  const startAuto = useCallback(async () => {
    setJobStatus("running");
    const res = await fetch("/api/backup/start-auto", { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      setJobStatus(j.error || "failed");
      return;
    }
    setFilesDone(j.filesDone || 0);
    if (!j.done) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => runTick(), 4000);
      runTick();
    } else {
      setJobStatus("completed");
    }
  }, [runTick]);

  useEffect(() => {
    load();
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("paid") === "1") setPaid(true);
    if (p.get("setup") === "google") setOauthConfigured(false);
    if (p.get("autostart") === "1" && googleLinked && paid) {
      startAuto();
      window.history.replaceState({}, "", "/dashboard/team");
    }
  }, [googleLinked, paid, startAuto]);

  useEffect(() => {
    if (jobStatus === "running" && !tickRef.current) {
      tickRef.current = setInterval(() => runTick(), 4000);
    }
  }, [jobStatus, runTick]);

  if (!paid) {
    return (
      <>
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1E2639] p-6 text-center">
          <p className="text-slate-300">
            BharatCloud Pro unlocks <strong>automatic Google Drive archive</strong> for your company.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white"
          >
            View plans &amp; pay (₹1999/mo)
          </Link>
        </div>
        <BackupValueStrip />
      </>
    );
  }

  if (!oauthConfigured) {
    return (
      <>
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-semibold text-amber-100">Google backup setup required</p>
          <p className="mt-2 text-sm text-amber-200/90">
            Add Google OAuth in Vercel (Production + Preview), then redeploy. Your app will not crash —
            this screen guides you.
          </p>
          <a
            href="https://github.com/sahilrana1940/bharatcloud-website/blob/main/docs/GOOGLE_DRIVE_CONNECT.md"
            className="mt-4 inline-block text-sm text-cyan-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            Open setup guide
          </a>
        </div>
        <BackupValueStrip />
      </>
    );
  }

  if (!s3Ok) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100">
        Archive storage is not configured. Set <code>WASABI_*</code> or <code>E2E_S3_*</code> and{" "}
        <code>ARCHIVE_S3_BUCKET=rjrm-archiver</code> on Vercel.
      </div>
    );
  }

  if (!googleLinked) {
    return (
      <>
        <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-sky-950/80 to-[#1E2639] p-8 text-center">
          <Cloud className="mx-auto h-12 w-12 text-cyan-400" />
          <h2 className="mt-4 text-xl font-bold text-white">
            Connect Company Google Drive to Start Backup
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            One click — we list your entire Drive, compress photos, and store copies in{" "}
            <span className="text-slate-200">rjrm-archiver</span> for{" "}
            <span className="text-slate-200">{userEmail}</span>.
          </p>
          <ul className="mx-auto mt-4 max-w-md text-left text-xs text-slate-500">
            <li>• Videos kept in original quality (safe for CCTV / long archives)</li>
            <li>• Photos optimized to save space</li>
            <li>• No manual file IDs or share links</li>
          </ul>
          <a
            href="/api/auth/google/connect?autostart=1"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/30"
          >
            Connect Google Drive &amp; Start Backup
          </a>
        </div>
        <BackupValueStrip />
      </>
    );
  }

  const running = jobStatus === "running" || jobStatus === "queued";

  return (
    <>
      <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="font-medium text-emerald-100">Google Drive connected</p>
        {running ? (
          <div className="mt-3">
            <p className="flex items-center gap-2 text-sm text-emerald-200/90">
              <Loader2 className="h-4 w-4 animate-spin" />
              Drive status: <strong>Backing up…</strong> ({filesDone} files)
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-emerald-500 to-cyan-400" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Keep this tab open or come back later — backup continues in chunks.
            </p>
          </div>
        ) : jobStatus === "completed" ? (
          <p className="mt-2 text-sm text-emerald-200/90">
            Drive status: <strong>Archived</strong> — {filesDone} files ·{" "}
            {formatGb(bytesCompressed)} stored
            {savedPct > 0 ? ` (${savedPct}% smaller than originals on photos)` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-200/90">Ready to archive your Google Drive.</p>
        )}

        {!running && (
          <button
            type="button"
            onClick={() => startAuto()}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {jobStatus === "completed" ? "Run backup again" : "Start automatic backup"}
          </button>
        )}
      </div>
      <BackupValueStrip />
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CloudUpload, Mail, Search, Upload } from "lucide-react";
import { motion } from "framer-motion";

import { EmployeeWorkspaceBanner } from "@/components/dashboard/EmployeeWorkspaceBanner";

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailBackedUp, setEmailBackedUp] = useState(0);
  const [emailBackupBusy, setEmailBackupBusy] = useState(false);

  useEffect(() => {
    fetch("/api/email/backup", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setEmailBackedUp(Number(j.backedUpCount) || 0))
      .catch(() => {});
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  async function startBackup() {
    setLoading(true);
    try {
      const res = await fetch("/api/backup/start-auto", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 402) {
        window.alert(
          "Payment required for Drive backup. Complete Paytm billing, or set PAYMENT_BYPASS=1 on Vercel.",
        );
        return;
      }
      if (res.ok) {
        window.alert("Backup started");
        return;
      }
      const err = await res.json().catch(() => ({}));
      window.alert((err as { error?: string }).error || "Could not start backup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <EmployeeWorkspaceBanner />
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{greeting}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Your workspace</h1>
        <p className="mt-3 text-slate-600">
          One tap to archive your Google Drive to BharatCloud. Upload field media from the links below.
        </p>

        <motion.button
          type="button"
          disabled={loading}
          onClick={startBackup}
          whileHover={{ y: -2 }}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#22D3EE] px-6 py-6 text-xl font-bold text-slate-900 shadow-xl shadow-cyan-400/35 disabled:opacity-60"
        >
          <CloudUpload className="h-8 w-8" />
          {loading ? "Starting…" : "Start my backup"}
        </motion.button>

        <article className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="font-semibold text-slate-900">Email Backup</p>
                <p className="text-sm text-slate-600">
                  {emailBackedUp.toLocaleString()} / 10,000 backed up to E2E Mumbai
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={emailBackupBusy}
              onClick={async () => {
                setEmailBackupBusy(true);
                try {
                  const res = await fetch("/api/email/backup", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ maxMessages: 100 }),
                  });
                  const j = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setEmailBackedUp((n) => n + (Number(j.emailCount) || 0));
                    router.push("/dashboard/email-backup");
                  } else {
                    window.alert(j.error || "Email backup failed");
                  }
                } finally {
                  setEmailBackupBusy(false);
                }
              }}
              className="rounded-xl bg-[#00BAF2] px-4 py-2 text-sm font-bold text-[#062033] disabled:opacity-60"
            >
              {emailBackupBusy ? "Backing up…" : "Backup Now"}
            </button>
          </div>
        </article>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/employee/upload"
            className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            <Upload className="h-9 w-9 text-cyan-500" />
            <span className="font-semibold text-slate-800">Upload CCTV / video</span>
          </Link>
          <Link
            href="/dashboard/employee/vault"
            className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            <Search className="h-9 w-9 text-cyan-500" />
            <span className="font-semibold text-slate-800">Search vault</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

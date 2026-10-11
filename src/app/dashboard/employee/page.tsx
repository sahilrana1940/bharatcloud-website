"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CloudUpload } from "lucide-react";

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
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
        window.alert("Payment Required — complete billing or ask admin to enable test bypass.");
        return;
      }
      if (res.ok) {
        window.alert("Backup Started");
        return;
      }
      const err = await res.json().catch(() => ({}));
      window.alert((err as { error?: string }).error || "Could not start backup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-medium text-slate-500">{greeting}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Your workspace</h1>
        <p className="mt-2 text-slate-600">
          Secure Google Drive backup to BharatCloud vault — one tap to start.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={startBackup}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#22D3EE] px-6 py-5 text-lg font-bold text-slate-900 shadow-lg shadow-cyan-400/30 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          <CloudUpload className="h-7 w-7" />
          {loading ? "Starting…" : "Start My Backup"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          Requires Google Drive connected in Settings and an active company plan.
        </p>
      </div>
    </div>
  );
}

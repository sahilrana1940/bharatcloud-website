"use client";
import { useEffect, useState } from "react";
import { Database, HardDrive, Check, AlertCircle, Loader2 } from "lucide-react";

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return { ok: res.ok, empty: true };
  try { return JSON.parse(text); }
  catch { return { ok: false, error: "Server returned HTML", raw: text.slice(0,200) }; }
}

export function BackupOnboarding({ userEmail }: { userEmail: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/backup/status", { cache: "no-store" });
      const data = await safeJson(res);
      setStatus(data);
    } catch (e: any) {
      setStatus({ ok: false, error: e.message });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStatus(); }, []);

  const connectDrive = async () => {
    setActionLoading(true);
    window.location.href = "/api/auth/google?redirect=/dashboard/team";
  };

  const startArchive = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/backup/start", { method: "POST" });
      const data = await safeJson(res);
      alert(data.ok? "Archive started - SIN1 Bucket: bharatcloud-archiver" : data.error || "Failed");
      await loadStatus();
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Checking backup status...</div>;
  }

  return (
    <div className="space-y-4">
      {status?.error && (
        <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 mt-0.5"/><span>{status.error}</span></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><HardDrive className="h-4 w-4"/> Google Drive</div>
          <p className="mt-2 text-xs text-slate-500">{status?.driveConnected? `Connected: ${status.driveEmail || userEmail}` : "Not connected"}</p>
          <div className="mt-3">
            {status?.driveConnected? (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"><Check className="h-3 w-3"/> Connected</span>
            ) : (
              <button onClick={connectDrive} disabled={actionLoading} className="w-full rounded-xl bg-black text-white text-sm py-2.5 hover:bg-slate-800 disabled:opacity-50">Connect Google Drive</button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Database className="h-4 w-4"/> BharatCloud SIN1</div>
          <p className="mt-2 text-xs text-slate-500">Bucket: bharatcloud-archiver • E2E • India Safe</p>
          <div className="mt-3">
            <button onClick={startArchive} disabled={!status?.driveConnected || actionLoading} className="w-full rounded-xl bg-[#0B5FFF] text-white text-sm py-2.5 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin"/>} Start Archive to Cloud
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-3 text-[11px] text-slate-500 flex justify-between">
        <span>User: {userEmail}</span><span>Role: {status?.role || "team"} • {status?.plan || "Free (5GB)"}</span>
      </div>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, HardDrive, Loader2 } from "lucide-react";

import { BRAND_FOOTER } from "@/lib/brand";

type ArchiveItem = {
  id: string;
  file_name: string;
  mime_type: string | null;
  size: number;
  source: "drive_backup" | "vault_upload";
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function EmployeeBackupVault({ userEmail }: { userEmail: string }) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{ filesDone?: number; jobStatus?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [archRes, vaultRes, sumRes] = await Promise.all([
        fetch("/api/backup/archive-list?page=1"),
        fetch("/api/personal/list?page=1"),
        fetch("/api/backup/summary"),
      ]);
      const arch = await archRes.json();
      const vault = await vaultRes.json();
      const sum = await sumRes.json();

      if (!archRes.ok && !arch.migrationRequired) {
        setError(arch.error || "Could not load drive backup files");
      }

      const driveItems: ArchiveItem[] = (arch.items || []).map((i: ArchiveItem) => ({
        ...i,
        source: "drive_backup",
      }));
      const uploadItems: ArchiveItem[] = (vault.items || []).map(
        (i: { id: string; file_name: string; file_size?: number }) => ({
          id: i.id,
          file_name: i.file_name,
          mime_type: null,
          size: Number(i.file_size || 0),
          source: "vault_upload" as const,
        }),
      );

      setItems([...driveItems, ...uploadItems]);
      setSummary({ filesDone: sum.filesDone, jobStatus: sum.jobStatus });
    } catch {
      setError("Network error loading vault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function download(item: ArchiveItem) {
    if (item.source === "vault_upload") {
      const res = await fetch(`/api/secure-download/${item.id}`);
      const j = await res.json();
      if (res.ok && j.signedUrl) window.open(j.signedUrl, "_blank");
      return;
    }
    const res = await fetch(`/api/backup/archive-download/${item.id}`);
    const j = await res.json();
    if (res.ok && j.signedUrl) window.open(j.signedUrl, "_blank");
    else setError(j.error || "Download failed");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <HardDrive className="h-4 w-4 text-cyan-600" />
        <span>
          Google Drive archive + CCTV uploads for <strong className="text-slate-800">{userEmail}</strong>
        </span>
        {summary?.jobStatus && (
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-800">
            Backup: {summary.jobStatus}
            {summary.filesDone != null ? ` · ${summary.filesDone} files processed` : ""}
          </span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Loading your backup…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
          <p className="font-medium text-slate-700">Abhi koi archived file nahi</p>
          <p className="mt-2 px-4">
            Pehle <strong>Settings → Google Drive connect</strong>, phir Employee home par{" "}
            <strong>Start my backup</strong>. Backup complete hone ke baad yahan Drive files dikhengi.
          </p>
          <p className="mt-2 text-xs text-slate-400">CCTV / video upload alag se Upload video se aati hai.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.source}-${item.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{item.file_name}</p>
                <p className="text-xs text-slate-500">
                  {item.source === "drive_backup" ? "Drive backup" : "Vault upload"} · {formatBytes(item.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => download(item)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
              >
                <Download className="h-3.5 w-3.5" />
                Open
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-[10px] text-slate-400">{BRAND_FOOTER}</p>
    </div>
  );
}

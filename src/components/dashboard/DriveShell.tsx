"use client";

import { BadgeCheck, Plus, Search, Shield } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FileGrid, type GridFile } from "@/components/dashboard/FileGrid";
import { PreviewModal } from "@/components/dashboard/PreviewModal";
import { Toast } from "@/components/dashboard/Toast";
import { useWorkspaceQuota } from "@/components/dashboard/WorkspaceShell";

export function DriveShell({
  userEmail,
  listSource,
  showUpload = true,
  title = "Drive",
  subtitle = "Your files, secure and organized",
  embedded = false,
}: {
  userEmail: string;
  listSource: string;
  showUpload?: boolean;
  title?: string;
  subtitle?: string;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<"google" | "safe">(
    listSource === "google" ? "google" : "safe",
  );
  const source =
    listSource === "drive"
      ? tab === "google"
        ? "google"
        : "bharatcloud"
      : listSource === "my-uploads"
        ? "my-uploads"
        : listSource;

  const [q, setQ] = useState("");
  const [files, setFiles] = useState<GridFile[]>([]);
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<GridFile | null>(null);
  const { storageLabel } = useWorkspaceQuota();
  const load = useCallback(async () => {
    const res = await fetch(
      `/api/drive/list?source=${source}&owner=${encodeURIComponent(userEmail)}&q=${encodeURIComponent(q)}`,
    );
    const j = await res.json();
    setFiles(j.files || []);
  }, [source, userEmail, q]);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function copy(url: string | null) {
    if (!url) return notify("No link available");
    await navigator.clipboard.writeText(url);
    notify("Link Copied!");
  }

  function wa(url: string | null) {
    if (!url) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
  }

  async function restoreFile(id: string) {
    await fetch("/api/drive/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: id }),
    });
    notify("File restored");
    load();
  }

  const shellClass = embedded
    ? "px-4 pt-4 sm:px-8"
    : "min-h-screen overflow-y-auto bg-transparent px-4 pb-16 pt-5 sm:px-8";
  const safeEmpty = listSource === "drive" && tab === "safe";

  return (
    <div className={shellClass}>
      {!embedded && (
        <header className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/55 px-4 py-4 shadow-[0_12px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl lg:flex-row lg:items-center">
          <h1 className="shrink-0 text-2xl font-bold tracking-tight text-[#0f2744] sm:text-3xl">
            {title}
          </h1>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files, folders, emails..."
              className="w-full rounded-2xl border border-blue-100/80 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none ring-blue-500/20 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-blue-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-900 shadow-sm">
              {storageLabel}
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-3 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                SR
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-[#0f2744]">Sahil Rana</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  Partner • Verified
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                </span>
              </span>
            </div>
          </div>
        </header>
      )}

      {listSource === "drive" && (
        <div className="mt-6 inline-flex flex-wrap gap-1 rounded-2xl border border-white/70 bg-white/50 p-1.5 shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setTab("google")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "google" ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "text-slate-600 hover:text-[#0f2744]"}`}
          >
            My Google Drive
          </button>
          <button
            type="button"
            onClick={() => setTab("safe")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "safe" ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "text-slate-600 hover:text-[#0f2744]"}`}
          >
            <Shield className="h-4 w-4" /> BharatCloud Safe Drive
          </button>
        </div>
      )}

      {embedded && (
        <div className="relative mt-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files, folders, emails..."
            className="w-full rounded-2xl border border-blue-100/80 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none"
          />
        </div>
      )}

      <div className="mt-8">
        {files.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-white/70 bg-white/50 px-6 py-20 text-center shadow-[0_20px_50px_rgba(37,99,235,0.08)] backdrop-blur-xl">
            <p className="text-xl font-semibold text-[#0f2744]">No files found</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {safeEmpty
                ? "Your BharatCloud Safe Drive is empty. Securely share or sync files from your team to get started."
                : subtitle}
            </p>
            {listSource === "drive" && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/shared"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Share
                </Link>
                <Link
                  href="/dashboard/team"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  Sync from Team & backup
                </Link>
              </div>
            )}
          </div>
        ) : (
          <FileGrid
            files={files}
            userEmail={userEmail}
            onCopy={copy}
            onOpen={setPreview}
            extraAction={
              listSource === "trash"
                ? (f) => (
                    <button
                      type="button"
                      onClick={() => restoreFile(String(f.id))}
                      className="mt-2 w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 py-2 text-sm font-medium text-white"
                    >
                      Restore
                    </button>
                  )
                : undefined
            }
          />
        )}
      </div>

      {preview && (
        <PreviewModal
          file={preview}
          onClose={() => setPreview(null)}
          onCopy={copy}
          onWhatsApp={wa}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

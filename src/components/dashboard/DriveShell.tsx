"use client";

import { Search, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { FileGrid, type GridFile } from "@/components/dashboard/FileGrid";
import { PreviewModal } from "@/components/dashboard/PreviewModal";
import { Toast } from "@/components/dashboard/Toast";

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
    : "min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10";

  return (
    <div className={shellClass}>
      {!embedded && (
        <header className="flex flex-col gap-2 border-b border-white/5 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-slate-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> All systems operational
          </div>
        </header>
      )}

      {listSource === "drive" && source === "bharatcloud" && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-[#1E2639]/60 px-4 py-3 text-sm text-slate-400">
          Automatic backup runs from{" "}
          <a href="/dashboard/team" className="text-cyan-400 underline">Team &amp; backup</a> after payment.
          Manual upload is disabled.
        </p>
      )}

      {listSource === "drive" && (
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#0F1420] p-1.5">
          <button
            type="button"
            onClick={() => setTab("google")}
            className={`rounded-xl px-4 py-2 text-sm ${tab === "google" ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white" : "text-slate-400"}`}
          >
            My Google Drive
          </button>
          <button
            type="button"
            onClick={() => setTab("safe")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${tab === "safe" ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white" : "text-slate-500"}`}
          >
            <Shield className="h-4 w-4" /> BharatCloud Safe Drive
          </button>
        </div>
      )}

      <div className="relative mt-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files, folders, emails..."
          className="w-full rounded-2xl border border-white/10 bg-[#1E2639] py-2.5 pl-10 pr-4 text-sm text-white"
        />
      </div>


      <div className="mt-8">
        {files.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-500">
            No files found. Upload or sync from Team page.
          </p>
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

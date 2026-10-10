"use client";

import {
  Cloud,
  FileText,
  FolderPlus,
  Link2,
  Play,
  Search,
  Shield,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DriveFile = {
  id: string;
  drive_file_id: string;
  name: string;
  owner_email: string;
  size: number;
  mime_type?: string | null;
  publicLink: string | null;
  is_shortcut?: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function extLabel(name: string, mime?: string | null) {
  const ext = name.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 5) return ext;
  if (mime?.includes("pdf")) return "PDF";
  if (mime?.startsWith("video/")) return "MP4";
  if (mime?.startsWith("image/")) return "IMG";
  return "FILE";
}

function fileKind(f: DriveFile) {
  const n = f.name.toLowerCase();
  if (
    f.mime_type?.startsWith("video/") ||
    n.includes("cctv") ||
    /\.(mp4|mov|webm|mkv)$/.test(n)
  ) {
    return "video";
  }
  if (f.mime_type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/.test(n)) {
    return "image";
  }
  if (f.mime_type?.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  return "other";
}

function uploadFileWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ file?: DriveFile; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    xhr.open("POST", "/api/drive/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ file: j.file });
        else resolve({ error: j.error || "Upload failed" });
      } catch {
        resolve({ error: "Upload failed" });
      }
    };
    xhr.onerror = () => resolve({ error: "Network error" });
    xhr.send(fd);
  });
}

function FileCard({
  file,
  tab,
  userEmail,
  onCopy,
  onBackup,
}: {
  file: DriveFile;
  tab: "google" | "safe";
  userEmail: string;
  onCopy: (url: string | null) => void;
  onBackup: () => void;
}) {
  const kind = fileKind(file);
  const ownerYou = file.owner_email === userEmail ? "you" : file.owner_email;

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639] shadow-lg transition hover:border-sky-500/40 hover:shadow-sky-500/10"
    >
      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
        {kind === "image" && file.publicLink && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.publicLink}
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
        )}
        {kind === "video" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-slate-800/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Play className="h-7 w-7 fill-white text-white" />
              </span>
            </div>
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur">
              09/10/2024
            </span>
          </>
        )}
        {kind === "pdf" && (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-16 w-16 text-slate-500" />
            <span className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
              PDF
            </span>
          </div>
        )}
        {kind === "other" && (
          <div className="flex h-full items-center justify-center text-slate-600">
            <FileText className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="truncate font-semibold text-slate-100">{file.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {formatSize(file.size)} • {extLabel(file.name, file.mime_type)}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">Owner: {ownerYou}</p>
        {tab === "safe" ? (
          <button
            type="button"
            onClick={() => onCopy(file.publicLink)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/10 py-2 text-sm font-medium text-sky-400 transition hover:bg-sky-500/20"
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackup}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-2 text-sm font-medium text-white"
          >
            Backup Now
          </button>
        )}
      </div>
    </article>
  );
}

export function DrivePageClient({ userEmail }: { isAdmin?: boolean; userEmail: string }) {
  const [tab, setTab] = useState<"google" | "safe">("safe");
  const [q, setQ] = useState("");
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const source = tab === "google" ? "google" : "bharatcloud";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/drive/list?source=${source}&owner=${encodeURIComponent(userEmail)}`,
    );
    const j = await res.json();
    setLoading(false);
    if (res.ok || tab === "safe") setAllFiles(j.files || []);
    else setAllFiles([]);
  }, [source, userEmail, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const files = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allFiles;
    return allFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) ||
        f.owner_email.toLowerCase().includes(needle),
    );
  }, [allFiles, q]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function copyLink(link: string | null) {
    if (!link) {
      showToast("No link available");
      return;
    }
    await navigator.clipboard.writeText(link);
    showToast("Link Copied!");
  }

  async function onFilesPicked(fileList: FileList | null) {
    if (!fileList?.length) return;
    for (const file of Array.from(fileList)) {
      setUploadProgress(0);
      const result = await uploadFileWithProgress(file, setUploadProgress);
      if (result.error) showToast(result.error);
      else if (result.file) {
        setAllFiles((prev) => [result.file!, ...prev]);
        showToast(`Uploaded ${result.file.name}`);
      }
    }
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function backupNow(file: DriveFile) {
    const res = await fetch("/api/drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driveFileId: file.drive_file_id,
        ownerEmail: file.owner_email,
      }),
    });
    const j = await res.json();
    if (!res.ok) showToast(j.error || "Backup failed");
    else {
      showToast("Backed up");
      load();
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-6 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Drive
          </h1>
          <p className="mt-1 text-slate-500">Your files, secure and organized</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          All systems operational
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-[#0F1420] p-1.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setTab("google")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "google"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            My Google Drive
          </button>
          <button
            type="button"
            onClick={() => setTab("safe")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === "safe"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/25"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Shield className="h-4 w-4" />
            BharatCloud Safe Drive
          </button>
        </div>

        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full rounded-2xl border border-white/10 bg-[#1E2639]/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 backdrop-blur placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="Search files, folders, emails..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {tab === "safe" && (
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFilesPicked(e.target.files)}
          />
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:shadow-sky-400/50 hover:brightness-110 disabled:opacity-60"
          >
            <Upload className="h-5 w-5" />
            Upload to BharatCloud
          </button>
          {uploadProgress !== null && (
            <div className="mt-4 max-w-sm">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-16 text-center text-slate-500">Loading your files…</p>
      ) : files.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0F1420]/50 px-6 py-16 text-center backdrop-blur">
          <div className="relative">
            <Cloud className="h-20 w-20 text-sky-500/80" />
            <Shield className="absolute -bottom-1 -right-1 h-10 w-10 text-cyan-400" />
          </div>
          <p className="mt-6 text-lg font-medium text-slate-200">
            Everything is organized and safe
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Upload to BharatCloud Safe Drive — no Google required.
          </p>
          <button
            type="button"
            onClick={() => showToast("Folders coming soon")}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1E2639] px-6 py-2.5 text-sm font-medium text-slate-300 hover:border-sky-500/30"
          >
            <FolderPlus className="h-4 w-4" />
            Create New Folder
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              tab={tab}
              userEmail={userEmail}
              onCopy={copyLink}
              onBackup={() => backupNow(f)}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

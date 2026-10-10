"use client";

import { FileIcon, FileImage, FileText, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function FileTypeIcon({ mime }: { mime?: string | null }) {
  if (mime?.startsWith("image/")) return <FileImage className="h-5 w-5 text-sky-500" />;
  if (mime?.includes("pdf")) return <FileText className="h-5 w-5 text-orange-500" />;
  return <FileIcon className="h-5 w-5 text-slate-400" />;
}

function uploadFileWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ file?: DriveFile; publicUrl?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    xhr.open("POST", "/api/drive/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ file: j.file, publicUrl: j.publicUrl });
        } else {
          resolve({ error: j.error || "Upload failed" });
        }
      } catch {
        resolve({ error: "Upload failed" });
      }
    };
    xhr.onerror = () => resolve({ error: "Network error" });
    xhr.send(fd);
  });
}

export function DrivePageClient({
  userEmail,
}: {
  isAdmin?: boolean;
  userEmail: string;
}) {
  const [tab, setTab] = useState<"google" | "safe">("safe");
  const [q, setQ] = useState("");
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
  const [driveFull, setDriveFull] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const source = tab === "google" ? "google" : "bharatcloud";

  const load = useCallback(async () => {
    if (tab !== "safe" && tab !== "google") return;
    setLoading(true);
    setListError("");
    const res = await fetch(
      `/api/drive/list?source=${source}&owner=${encodeURIComponent(userEmail)}`,
    );
    const j = await res.json();
    setLoading(false);
    if (!res.ok && tab === "google") {
      setListError(j.error || "Could not load files");
      setAllFiles([]);
      return;
    }
    setListError(tab === "google" ? j.error || "" : "");
    setAllFiles(j.files || []);
  }, [source, userEmail, tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/team/users")
      .then((r) => r.json())
      .then((j) => {
        const me = (j.users || []).find(
          (u: { email: string }) => u.email === j.session?.email,
        );
        if (me) {
          setDriveFull(me.drive_used_gb / me.drive_limit_gb > 0.9);
        }
      });
  }, []);

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

  function shareWhatsApp(link: string | null) {
    if (!link) {
      showToast("No link available");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank");
  }

  async function onFilesPicked(fileList: FileList | null) {
    if (!fileList?.length) return;
    const filesToUpload = Array.from(fileList);
    for (let i = 0; i < filesToUpload.length; i++) {
      setUploadProgress(0);
      const result = await uploadFileWithProgress(filesToUpload[i], (pct) => {
        setUploadProgress(pct);
      });
      if (result.error) {
        showToast(result.error);
        continue;
      }
      if (result.file) {
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
    if (!res.ok) {
      showToast(j.error || "Backup failed");
      return;
    }
    showToast("Backed up to BharatCloud Safe Drive");
    if (tab === "google") load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Drive</h1>
      {driveFull && tab === "safe" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Drive Full! 1 Click me khali karo — Shortcut banao
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm ${tab === "google" ? "bg-sky-600 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          onClick={() => setTab("google")}
        >
          My Google Drive
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm ${tab === "safe" ? "bg-sky-600 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          onClick={() => setTab("safe")}
        >
          BharatCloud Safe Drive
        </button>
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
          <Button
            type="button"
            size="lg"
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 py-6 text-base font-semibold sm:w-auto sm:px-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
          >
            <Plus className="mr-2 h-5 w-5" />
            Upload File to BharatCloud
          </Button>
          {uploadProgress !== null && (
            <div className="mt-4 max-w-md">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="max-w-md"
          placeholder="Search name or owner"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {listError && tab === "google" && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">{listError}</p>
      )}

      {loading && tab === "google" ? (
        <p className="mt-8 text-sm text-slate-500">Loading files…</p>
      ) : files.length === 0 && tab === "safe" && uploadProgress === null ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No files yet. Use <strong>Upload File to BharatCloud</strong> above — no
          Google Drive needed.
        </p>
      ) : files.length === 0 && tab === "google" ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No files found. Click Sync Now in Team page to start backup
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileTypeIcon mime={f.mime_type} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{f.name}</p>
                  <p className="text-xs text-slate-500">
                    {tab === "safe" ? formatSize(f.size) : `${f.owner_email} · ${formatSize(f.size)}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tab === "google" ? (
                  <Button type="button" size="sm" onClick={() => backupNow(f)}>
                    Backup Now
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(f.publicLink)}
                    >
                      Copy Link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => shareWhatsApp(f.publicLink)}
                    >
                      Share on WhatsApp
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}

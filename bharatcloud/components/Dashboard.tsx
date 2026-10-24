"use client";

import { signOut, type User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase-client";

type FileRow = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  downloadUrl: string;
};

type FilesResponse = {
  bucket: string;
  usedFormatted: string;
  usedBytes: number;
  files: FileRow[];
  error?: string;
};

export function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");

  const authHeader = useCallback(async () => {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/files", { headers });
      const data = (await res.json()) as FilesResponse;
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    try {
      const headers = await authHeader();
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", headers, body: form });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Upload failed");
      }
      setMessage(`Uploaded ${files.length} file(s) to IDrive E2.`);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">BharatCloud</p>
            <p className="font-semibold text-slate-900">{user.displayName || user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full border border-slate-200" />
            ) : null}
            <button
              type="button"
              onClick={() => signOut(getFirebaseAuth())}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Bucket" value={stats?.bucket || "bharatcloud-backup"} />
          <StatCard label="Used storage" value={loading ? "…" : stats?.usedFormatted || "0 B"} />
        </div>

        <div
          className={`mt-8 rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragOver ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void uploadFiles(e.dataTransfer.files);
          }}
        >
          <p className="text-lg font-semibold text-slate-800">Drag & drop files here</p>
          <p className="mt-1 text-sm text-slate-500">Uploaded securely via API to IDrive E2 · prefix: your user id</p>
          <label className="mt-6 inline-block cursor-pointer rounded-full bg-[#0369a1] px-6 py-3 text-sm font-bold text-white hover:bg-[#075985]">
            {uploading ? "Uploading…" : "Choose files"}
            <input
              type="file"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
            />
          </label>
        </div>

        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
        {stats?.error ? <p className="mt-4 text-sm text-amber-700">{stats.error}</p> : null}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Your files</h2>
          {loading ? (
            <p className="mt-4 text-slate-500">Loading…</p>
          ) : !stats?.files?.length ? (
            <p className="mt-4 text-slate-500">No files yet — upload your first backup.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {stats.files.map((f) => (
                <li key={f.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{f.name}</p>
                    <p className="text-xs text-slate-500">
                      {(f.size / 1024).toFixed(1)} KB
                      {f.lastModified ? ` · ${new Date(f.lastModified).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <a
                    href={f.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

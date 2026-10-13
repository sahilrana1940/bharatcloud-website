"use client";

import { Copy, FileText, Share2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";
import {
  GlassPanel,
  ProPageHeader,
  ProPrimaryButton,
  ProTableWrap,
} from "@/components/ui/pro/primitives";
import { formatB3Bytes } from "@/lib/b3/format";

type B3File = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  aiTag: string;
  createdAt: string;
};

const TAG_STYLES: Record<string, string> = {
  finance: "bg-emerald-100 text-emerald-800",
  legal: "bg-violet-100 text-violet-800",
  media: "bg-sky-100 text-sky-800",
  hr: "bg-amber-100 text-amber-900",
  general: "bg-slate-100 text-slate-700",
};

export function B3StorageClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<B3File[]>([]);
  const [usedGb, setUsedGb] = useState(0);
  const [limitGb, setLimitGb] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  const load = useCallback(async () => {
    const res = await fetch("/api/b3/files");
    const j = await res.json();
    setFiles(j.files || []);
    setUsedGb(j.usedGb ?? 0);
    setLimitGb(j.limitGb ?? 50);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const percent = limitGb > 0 ? Math.min(100, Math.round((usedGb / limitGb) * 100)) : 0;

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/b3/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Upload failed");
        setToast(`Uploaded ${file.name} · AI tag: ${j.aiTag}`);
      }
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function copyLink(url: string) {
    void navigator.clipboard.writeText(url);
    setToast("Share link copied");
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <ProPageHeader
        eyebrow="Bharat Big Bucket"
        title="B3 Storage"
        description="India-hosted object storage for your company — AI-tagged files, shareable links. GST-ready billing syncs from the Billing page."
        action={
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => onUpload(e.target.files)}
            />
            <ProPrimaryButton
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </ProPrimaryButton>
          </div>
        }
      />

      <GlassPanel className="mb-8 p-6">
        <p className="text-sm font-medium text-slate-600">Total used</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {usedGb.toFixed(1)} GB{" "}
          <span className="text-lg font-semibold text-slate-400">/ {limitGb} GB</span>
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-cyan-500 to-emerald-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{percent}% of B3 quota</p>
      </GlassPanel>

      <div className="mb-4 flex gap-2">
        {(["grid", "table"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
              view === v
                ? "bg-gradient-to-r from-cyan-500 to-sky-500 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <GlassPanel key={f.id} hover className="flex flex-col p-5">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50">
                <FileText className="h-6 w-6 text-cyan-600" />
              </div>
              <p className="truncate font-semibold text-slate-900" title={f.fileName}>
                {f.fileName}
              </p>
              <p className="mt-1 text-sm text-slate-500">{formatB3Bytes(f.fileSize)}</p>
              <span
                className={`mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  TAG_STYLES[f.aiTag] || TAG_STYLES.general
                }`}
              >
                {f.aiTag}
              </span>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(f.createdAt).toLocaleDateString("en-IN")}
              </p>
              <div className="mt-4 flex gap-2">
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => copyLink(f.fileUrl)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-50 py-2 text-xs font-semibold text-cyan-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Share link
                </button>
              </div>
            </GlassPanel>
          ))}
        </div>
      ) : (
        <ProTableWrap>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">File name</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">AI tag</th>
                <th className="px-4 py-3">Share link</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{f.fileName}</td>
                  <td className="px-4 py-3">{formatB3Bytes(f.fileSize)}</td>
                  <td className="px-4 py-3 capitalize">{f.aiTag}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copyLink(f.fileUrl)}
                      className="text-xs font-semibold text-cyan-700 underline"
                    >
                      Copy URL
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(f.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProTableWrap>
      )}

      <Toast message={toast} />
    </div>
  );
}

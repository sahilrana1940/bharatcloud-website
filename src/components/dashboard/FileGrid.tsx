"use client";

import { FileText, ImageIcon, Link2, Play } from "lucide-react";
import { useState } from "react";

export type GridFile = {
  id: string;
  drive_file_id: string;
  name: string;
  owner_email: string;
  size: number;
  mime_type?: string | null;
  publicLink: string | null;
};

function typeLabel(name: string, mime?: string | null) {
  if (mime?.includes("jpeg") || /\.jpe?g$/i.test(name)) return "JPEG";
  if (mime?.startsWith("video/")) return "MP4";
  if (mime?.includes("pdf")) return "PDF";
  return (name.split(".").pop() || "FILE").toUpperCase();
}

function formatSize(bytes: number) {
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function kind(f: GridFile) {
  const n = f.name.toLowerCase();
  if (f.mime_type?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(n)) return "video";
  if (f.mime_type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(n)) return "image";
  return "other";
}

function Thumb({ file }: { file: GridFile }) {
  const [err, setErr] = useState(false);
  const k = kind(file);
  const url = file.publicLink;
  if (k === "image" && url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="h-full w-full object-cover" onError={() => setErr(true)} />
    );
  }
  if (k === "video" && url && !err) {
    return (
      <div className="relative h-full w-full">
        <video src={url} muted preload="metadata" className="h-full w-full object-cover" onError={() => setErr(true)} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <Play className="h-10 w-10 fill-white text-white" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center bg-[#151b2e]">
      {k === "image" ? <ImageIcon className="h-10 w-10 text-slate-500" /> : <FileText className="h-10 w-10 text-slate-500" />}
    </div>
  );
}

export function FileGrid({
  files,
  userEmail,
  onCopy,
  onOpen,
  extraAction,
}: {
  files: GridFile[];
  userEmail: string;
  onCopy: (url: string | null) => void;
  onOpen: (f: GridFile) => void;
  extraAction?: (f: GridFile) => React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {files.map((f) => (
        <article key={f.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
          <button type="button" className="block h-[180px] w-full" onClick={() => onOpen(f)}>
            <Thumb file={f} />
          </button>
          <div className="p-4">
            <p className="truncate font-bold text-slate-100">{f.name}</p>
            <p className="mt-1 text-xs text-slate-400">{formatSize(f.size)} • {typeLabel(f.name, f.mime_type)}</p>
            <p className="text-[11px] text-slate-500">
              Owner: {f.owner_email === userEmail ? "you" : f.owner_email}
            </p>
            {extraAction?.(f)}
            <button
              type="button"
              onClick={() => onCopy(f.publicLink)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] py-2.5 text-sm font-medium text-blue-400"
            >
              <Link2 className="h-4 w-4" />
              Copy link
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

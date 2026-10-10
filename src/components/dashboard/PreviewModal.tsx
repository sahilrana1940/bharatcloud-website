"use client";

import { Link2, X } from "lucide-react";

import type { GridFile } from "@/components/dashboard/FileGrid";

export function PreviewModal({
  file,
  onClose,
  onCopy,
  onWhatsApp,
}: {
  file: GridFile;
  onClose: () => void;
  onCopy: (url: string | null) => void;
  onWhatsApp: (url: string | null) => void;
}) {
  const isVideo = file.mime_type?.startsWith("video/");
  const isImage = file.mime_type?.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="truncate font-semibold">{file.name}</p>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[50vh] overflow-auto bg-black/40 p-2">
          {isImage && file.publicLink && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.publicLink} alt="" className="mx-auto max-h-[48vh] object-contain" />
          )}
          {isVideo && file.publicLink && (
            <video src={file.publicLink} controls className="mx-auto max-h-[48vh] w-full" />
          )}
          {!isImage && !isVideo && (
            <p className="py-12 text-center text-slate-500">Preview not available</p>
          )}
        </div>
        <div className="flex gap-3 p-4">
          <button
            type="button"
            onClick={() => onCopy(file.publicLink)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] py-2.5 text-blue-400"
          >
            <Link2 className="h-4 w-4" /> Copy Link
          </button>
          <button
            type="button"
            onClick={() => onWhatsApp(file.publicLink)}
            className="flex-1 rounded-lg bg-emerald-600/20 py-2.5 text-emerald-400"
          >
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

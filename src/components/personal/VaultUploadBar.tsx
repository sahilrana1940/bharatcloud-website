"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export function VaultUploadBar({
  type = "photo",
  onDone,
  onError,
}: {
  type?: string;
  onDone?: () => void;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function onPick(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setStatus("");
    let ok = 0;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("type", type);
      const res = await fetch("/api/vault-upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok) ok += 1;
      else {
        const msg = j.error || `Upload failed (${res.status})`;
        setStatus(msg);
        onError?.(msg);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (ok > 0) {
      setStatus(ok === 1 ? "Uploaded" : `${ok} files uploaded`);
      onDone?.();
    }
  }

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Uploading HD…" : "Upload HD original"}
      </button>
      {status && (
        <p className="mt-2 text-center text-xs text-cyan-300 sm:text-left">{status}</p>
      )}
    </div>
  );
}

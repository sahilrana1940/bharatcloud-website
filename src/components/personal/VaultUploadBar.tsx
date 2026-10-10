"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export function VaultUploadBar({
  type = "photo",
  onDone,
}: {
  type?: string;
  onDone?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("type", type);
      await fetch("/api/vault-upload", { method: "POST", body: fd });
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    onDone?.();
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
    </div>
  );
}

"use client";

import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

function uploadWithProgress(
  file: File,
  type: string,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    xhr.open("POST", "/api/vault-upload");
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const j = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve({ ok: true });
        else resolve({ ok: false, error: j.error || `Upload failed (${xhr.status})` });
      } catch {
        resolve({ ok: false, error: "Upload failed" });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error" });
    xhr.ontimeout = () => resolve({ ok: false, error: "Upload timed out — try a smaller file" });
    xhr.send(fd);
  });
}

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
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onPick(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    setStatus("idle");
    setMessage("");
    setProgress(0);
    let ok = 0;
    const list = Array.from(files);
    try {
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const base = Math.round((i / list.length) * 100);
        const r = await uploadWithProgress(f, type, (pct) => {
          const slice = 100 / list.length;
          setProgress(Math.min(99, Math.round(base + (pct / 100) * slice)));
        });
        if (r.ok) ok += 1;
        else {
          setStatus("error");
          setMessage(r.error || "Upload failed");
          setProgress(null);
          onError?.(r.error || "Upload failed");
          break;
        }
      }
      if (ok > 0) {
        setProgress(100);
        setStatus("success");
        setMessage(ok === 1 ? "Upload complete — saved to vault" : `${ok} files saved`);
        onDone?.();
        window.setTimeout(() => {
          setStatus("idle");
          setMessage("");
          setProgress(null);
        }, 3500);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0f1a2e] to-[#141c2c] p-5 shadow-lg shadow-cyan-500/5">
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
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 py-3.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition hover:brightness-110 disabled:opacity-70 sm:w-auto sm:min-w-[220px] sm:px-10"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Upload className="h-5 w-5 transition group-hover:-translate-y-0.5" />
        )}
        {busy ? "Uploading…" : status === "success" ? "Done" : "Upload HD original"}
      </button>

      {busy && progress !== null && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[10px] text-slate-400">
            <span>Secure upload to Bharat vault</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-center text-xs sm:text-left ${
            status === "error" ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

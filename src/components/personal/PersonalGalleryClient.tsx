"use client";

import { Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";

type Item = {
  id: string;
  file_name: string;
  file_size: number;
  type: string;
  storage_tier: "hot" | "cold" | "vault";
  is_deleted: boolean;
  created_at: string;
};

function tierBadge(tier: string) {
  if (tier === "cold") return { label: "COLD ❄️ Archive", className: "bg-sky-900/60 text-sky-200" };
  return { label: "HOT 🔥 Recent", className: "bg-orange-900/50 text-orange-200" };
}

function formatSize(n: number) {
  if (n < 1024 ** 2) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

export function PersonalGalleryClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/personal/list");
    const j = await res.json();
    setItems((j.items || []).filter((i: Item) => !i.is_deleted));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function openItem(id: string) {
    const res = await fetch(`/api/secure-download/${id}`);
    const j = await res.json();
    if (!res.ok) return notify(j.error || "Cannot open");
    setPreview(j.url);
  }

  async function onUpload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload-hd", { method: "POST", body: fd });
      if (!res.ok) notify("Upload failed");
    }
    notify("HD backup saved (hot + vault)");
    load();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function softDelete(id: string) {
    await fetch("/api/personal/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    notify("Removed from gallery — vault copy kept");
    load();
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Personal HD Vault</h1>
          <p className="text-sm text-slate-500">
            🇮🇳 Data in Mumbai — HOT/COLD encrypted vault
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white"
        >
          <Upload className="h-4 w-4" /> Upload HD original
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => {
          const badge = tierBadge(item.storage_tier);
          const isImage = item.type === "photo" || item.type === "whatsapp";
          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]"
            >
              <button
                type="button"
                className="relative block h-[180px] w-full bg-[#151b2e]"
                onClick={() => openItem(item.id)}
              >
                <span
                  className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <div className="flex h-full items-center justify-center text-slate-500">
                  {isImage ? "📷 HD Photo" : item.type === "video" ? "🎬 HD Video" : "📄 File"}
                </div>
              </button>
              <div className="p-4">
                <p className="truncate font-bold text-slate-100">{item.file_name}</p>
                <p className="text-xs text-slate-400">{formatSize(item.file_size)}</p>
                <button
                  type="button"
                  onClick={() => softDelete(item.id)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm text-red-300"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {preview.includes("video") || preview.endsWith(".mp4") ? (
              <video src={preview} controls className="max-h-[85vh] w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-[85vh] rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}

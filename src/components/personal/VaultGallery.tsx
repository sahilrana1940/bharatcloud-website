"use client";

import { useCallback, useEffect, useState } from "react";

import { BRAND_FOOTER } from "@/lib/brand";

function vaultPreviewLabel(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "PDF";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "VIDEO";
  if (["jpg", "jpeg", "png", "webp", "heic"].includes(ext)) return "PHOTO";
  return "FILE";
}

function VaultThumb({
  thumbUrl,
  fileName,
}: {
  thumbUrl: string | null;
  fileName: string;
}) {
  const [broken, setBroken] = useState(false);
  const label = vaultPreviewLabel(fileName);
  const showImg = Boolean(thumbUrl) && !broken && label === "PHOTO";

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbUrl!}
        alt=""
        className="h-32 w-full object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className="flex h-32 flex-col items-center justify-center gap-1 bg-[#151c2c] text-slate-400">
      <span className="text-xs font-semibold tracking-wide text-cyan-400/90">
        {label}
      </span>
      <span className="max-w-[90%] truncate text-[10px] text-slate-500">
        {fileName}
      </span>
    </div>
  );
}

type Item = {
  id: string;
  file_name: string;
  storage_tier: string;
  thumbUrl: string | null;
};

export function VaultGallery({
  typeFilter,
  refreshKey = 0,
}: {
  typeFilter?: string;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hdUrl, setHdUrl] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      const q = typeFilter ? `type=${typeFilter}&` : "";
      const res = await fetch(`/api/personal/list?${q}page=${p}`);
      const j = await res.json();
      setItems((prev) => (append ? [...prev, ...(j.items || [])] : j.items || []));
      setHasMore(Boolean(j.hasMore));
      setLoading(false);
    },
    [typeFilter],
  );

  useEffect(() => {
    load(1, false);
    setPage(1);
  }, [load, refreshKey]);

  async function openHd(id: string) {
    const res = await fetch(`/api/secure-download/${id}`);
    const j = await res.json();
    if (res.ok) setHdUrl(j.signedUrl);
  }

  return (
    <div>
      <p className="mb-4 text-center text-[10px] text-slate-500">{BRAND_FOOTER}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading && items.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-[#1E2639]" />
            ))
          : null}
        {!loading && items.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">
            No files yet. Upload above — if upload fails, check Supabase storage buckets.
          </p>
        ) : null}
        {!loading &&
          items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openHd(item.id)}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#1E2639]"
              >
                <VaultThumb thumbUrl={item.thumbUrl} fileName={item.file_name} />
                <p className="truncate px-2 py-1 text-[10px] text-slate-400">
                  {item.storage_tier === "cold" ? "❄️" : "🔥"} {item.file_name}
                </p>
              </button>
            ))}
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const n = page + 1;
            setPage(n);
            load(n, true);
          }}
          className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm text-slate-300"
        >
          Load More
        </button>
      )}
      {hdUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setHdUrl(null)}>
          <a href={hdUrl} download className="absolute right-4 top-4 text-cyan-400 text-sm">Download HD</a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hdUrl} alt="" className="max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

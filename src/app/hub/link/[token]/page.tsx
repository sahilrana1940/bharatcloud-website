"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { bytesLabel } from "@/lib/product/money";

export default function LinkPage() {
  const params = useParams<{ token: string }>();
  const [item, setItem] = useState<{ name: string; kind: string; permission: string; size: number; url: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetch(`/api/product/link?token=${params.token}`)
        .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
        .then(({ ok, body }) => {
          if (!ok) setError(body.error || "Link kaam nahi kar raha.");
          else setItem(body);
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [params.token]);

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <p className="text-sm font-semibold">BharatCloud</p>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {item ? (
        <article className="mt-4 rounded-3xl bg-white p-5">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="mt-2 text-sm">{item.kind} · {item.permission} · {bytesLabel(item.size || 0)}</p>
          {item.url ? <a href={item.url} className="mt-4 inline-block font-semibold text-[#0f6b4c]">Download</a> : <p className="mt-4 text-sm">Is link pe download band hai.</p>}
        </article>
      ) : null}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { bytesLabel } from "@/lib/product/money";

type Backup = { id: string; subject: string; from_email: string; size_bytes: number; created_at: string; user_id: string };

export function BackupApp() {
  const [rows, setRows] = useState<Backup[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [usage, setUsage] = useState({ usedBytes: 0, limitBytes: 1 });
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/product/backup");
    const body = await response.json();
    if (!response.ok) setError(body.error || "Backup nahi khula.");
    else {
      setRows(body.backups || []);
      setLast(body.lastBackup);
      setTotal(body.totalBytes || 0);
      setUsage(body.usage);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/backup", { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Backup save nahi hua.");
    else {
      setNote("Backup Tijori me save ho gaya. Ye delete nahi hoga.");
      event.currentTarget.reset();
      await load();
    }
  }

  const percent = Math.min(100, Math.round((usage.usedBytes / Math.max(usage.limitBytes, 1)) * 100));

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-6 text-[#1c1915]">
      <div className="mx-auto max-w-3xl">
        <Link href="/hub" className="text-sm font-semibold">BharatCloud</Link>
        <h1 className="mt-4 text-3xl font-bold">Email Backup</h1>
        <p className="mt-2 text-sm">Mailbox export (.eml ya zip) Tijori me rakho. Drive aur backup dono ek hi storage se chalte hain. Delete ka option nahi hai.</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-[#0f6b4c]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs">{bytesLabel(usage.usedBytes)} use · {bytesLabel(Math.max(0, usage.limitBytes - usage.usedBytes))} bacha</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl bg-white p-4"><p className="text-xs">Last Backup</p><p className="font-semibold">{last ? new Date(last).toLocaleString("en-IN") : "Abhi nahi"}</p></article>
          <article className="rounded-2xl bg-white p-4"><p className="text-xs">Kitna Backup Hua</p><p className="font-semibold">{bytesLabel(total)}</p></article>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-2 rounded-3xl bg-white p-5 text-sm">
          <input name="subject" placeholder="Subject" className="w-full rounded-xl border px-3 py-2" />
          <input name="fromEmail" placeholder="From email" className="w-full rounded-xl border px-3 py-2" />
          <input name="file" type="file" required className="w-full" />
          <button className="rounded-full bg-[#c65d12] px-4 py-2 font-semibold text-white">Backup save karo</button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {note ? <p className="mt-3 text-sm text-[#0f6b4c]">{note}</p> : null}
        <ul className="mt-5 space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl bg-white p-3">
              <p className="font-semibold">{row.subject}</p>
              <p>{row.from_email} · {bytesLabel(row.size_bytes)} · {new Date(row.created_at).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

"use client";

import { Link2, MessageCircle, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { FileGrid, type GridFile } from "@/components/dashboard/FileGrid";
import { PreviewModal } from "@/components/dashboard/PreviewModal";
import { Toast } from "@/components/dashboard/Toast";

type MailRow = {
  id: string;
  subject: string;
  from_email: string;
  date: string;
  body_text?: string;
};

export function EmployeeVaultClient({ userEmail }: { userEmail: string }) {
  const [q, setQ] = useState("");
  const [files, setFiles] = useState<GridFile[]>([]);
  const [emails, setEmails] = useState<MailRow[]>([]);
  const [preview, setPreview] = useState<GridFile | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [f, e] = await Promise.all([
      fetch(`/api/drive/list?source=vault&q=${encodeURIComponent(q)}`).then((r) => r.json()),
      fetch(`/api/emails/list?q=${encodeURIComponent(q)}`).then((r) => r.json()),
    ]);
    setFiles(f.files || []);
    setEmails(e.emails || []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function copy(url: string | null) {
    if (!url) return notify("No link");
    await navigator.clipboard.writeText(url);
    notify("Link copied");
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <h1 className="text-2xl font-bold text-white">Company vault (read-only)</h1>
      <div className="relative mt-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files and emails…"
          className="w-full rounded-2xl border border-white/10 bg-[#1E2639] py-2.5 pl-10 pr-4 text-sm text-white"
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Files</h2>
      <FileGrid
        files={files}
        userEmail={userEmail}
        onCopy={copy}
        onOpen={setPreview}
        extraAction={(f) => (
          <div className="mt-2 flex gap-2">
            {f.publicLink && (
              <a
                href={f.publicLink}
                download
                className="flex-1 rounded-lg border border-white/10 py-2 text-center text-xs text-slate-300"
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={() =>
                window.open(`https://wa.me/?text=${encodeURIComponent(f.publicLink || "")}`, "_blank")
              }
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/30 py-2 text-xs text-emerald-400"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </button>
          </div>
        )}
      />

      <h2 className="mt-10 text-lg font-semibold text-white">Emails</h2>
      <ul className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#1E2639]">
        {emails.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <p className="font-bold text-slate-100">{e.subject}</p>
            <p className="text-xs text-slate-400">{e.from_email}</p>
            <p className="text-[11px] text-slate-500">{new Date(e.date).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => copy(e.body_text || e.subject)}
                className="flex items-center gap-1 rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs text-blue-300"
              >
                <Link2 className="h-3 w-3" /> Forward
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(e.subject + " — " + (e.body_text || ""))}`,
                    "_blank",
                  )
                }
                className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400"
              >
                WhatsApp Share
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview && (
        <PreviewModal
          file={preview}
          onClose={() => setPreview(null)}
          onCopy={copy}
          onWhatsApp={(u) => window.open(`https://wa.me/?text=${encodeURIComponent(u || "")}`, "_blank")}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

"use client";

import { Mail, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { VaultGallery } from "@/components/personal/VaultGallery";
import { VaultUploadBar } from "@/components/personal/VaultUploadBar";

type MailRow = {
  id: string;
  subject: string;
  from_email: string;
  date: string;
  body_text?: string;
};

export function VaultPageClient({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<"files" | "emails">("files");
  const [refreshKey, setRefreshKey] = useState(0);
  const [q, setQ] = useState("");
  const [emails, setEmails] = useState<MailRow[]>([]);

  const loadEmails = useCallback(async () => {
    const res = await fetch(`/api/emails/list?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    });
    const j = await res.json();
    setEmails(j.emails || []);
  }, [q]);

  useEffect(() => {
    if (tab === "emails") loadEmails();
  }, [tab, loadEmails]);

  const filtered = emails.filter((e) => {
    if (!q.trim()) return true;
    const l = q.toLowerCase();
    return (
      e.subject?.toLowerCase().includes(l) ||
      e.from_email?.toLowerCase().includes(l)
    );
  });

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent pb-[140px] lg:pb-10">
      <div className="border-b border-[#10243E]/10 px-4 pb-4 pt-6 sm:px-8">
        <h1 className="text-3xl font-bold text-[#10243E]">
          My Vault — E2E backup
        </h1>
        <p className="text-slate-600">Encrypted company vault on E2E · {userEmail}</p>
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[#10243E]/10 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("files")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "files"
                ? "bg-[#00BAF2] text-[#062033]"
                : "text-slate-600"
            }`}
          >
            Files
          </button>
          <button
            type="button"
            onClick={() => setTab("emails")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "emails"
                ? "bg-[#00BAF2] text-[#062033]"
                : "text-slate-600"
            }`}
          >
            <Mail className="h-4 w-4" /> Emails
          </button>
        </div>
      </div>

      {tab === "files" ? (
        <div className="px-4 pt-4 sm:px-8">
          <VaultUploadBar onDone={() => setRefreshKey((k) => k + 1)} />
          <VaultGallery refreshKey={refreshKey} />
        </div>
      ) : (
        <div className="px-4 pt-6 sm:px-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search emails by subject, sender..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#10243E]"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#10243E]/10 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F4EFE6] text-slate-600">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                      No emails. Run Gmail sync from Team.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-slate-100 text-[#10243E] hover:bg-[#F4EFE6]"
                    >
                      <td className="px-4 py-3 font-bold">{e.subject || "(No subject)"}</td>
                      <td className="px-4 py-3 text-slate-400">{e.from_email}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {e.date ? new Date(e.date).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Mail, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DriveShell } from "@/components/dashboard/DriveShell";

type MailRow = {
  id: string;
  subject: string;
  from_email: string;
  date: string;
  body_text?: string;
};

export function VaultPageClient({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<"files" | "emails">("files");
  const [q, setQ] = useState("");
  const [emails, setEmails] = useState<MailRow[]>([]);

  const loadEmails = useCallback(async () => {
    const res = await fetch(`/api/emails/list?q=${encodeURIComponent(q)}`);
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
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] pb-[140px] lg:pb-10">
      <div className="border-b border-white/5 px-4 pb-4 pt-6 sm:px-8">
        <h1 className="text-3xl font-bold text-white">My Vault - Secured Backup</h1>
        <p className="text-slate-500">Files and emails for your company domain</p>
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[#0F1420] p-1.5">
          <button
            type="button"
            onClick={() => setTab("files")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "files"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white"
                : "text-slate-400"
            }`}
          >
            Files
          </button>
          <button
            type="button"
            onClick={() => setTab("emails")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              tab === "emails"
                ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white"
                : "text-slate-400"
            }`}
          >
            <Mail className="h-4 w-4" /> Emails
          </button>
        </div>
      </div>

      {tab === "files" ? (
        <DriveShell
          userEmail={userEmail}
          listSource="vault"
          showUpload={false}
          title=""
          subtitle=""
          embedded
        />
      ) : (
        <div className="px-4 pt-6 sm:px-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search emails by subject, sender..."
              className="w-full rounded-2xl border border-white/10 bg-[#1E2639] py-2.5 pl-10 pr-4 text-sm text-white"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
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
                      className="border-b border-white/5 text-slate-200 hover:bg-white/5"
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

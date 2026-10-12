"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MailRow = {
  id: string;
  owner_email: string;
  subject: string;
  from_email: string;
  date: string;
  body_text?: string;
  has_attachment?: boolean;
};

export function EmployeeMailArchiveClient({ userEmail }: { userEmail: string }) {
  const [q, setQ] = useState("");
  const [emails, setEmails] = useState<MailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forwardId, setForwardId] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardMsg, setForwardMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/emails/list?${params}`);
    const j = await res.json();
    if (!res.ok) {
      setError(j.error || "Could not load mail archive");
      setEmails([]);
    } else {
      setEmails(j.emails || []);
    }
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitForward() {
    if (!forwardId || !forwardTo.trim()) return;
    setForwardMsg("");
    const res = await fetch("/api/emails/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: forwardId, to: forwardTo.trim() }),
    });
    const j = await res.json();
    if (res.ok) {
      setForwardMsg(j.message || "Sent from company mail.");
      setForwardId(null);
      setForwardTo("");
    } else {
      setForwardMsg(j.error || "Forward failed");
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto px-4 pb-24 pt-6 sm:px-8">
      <div className="flex items-center gap-2">
        <Mail className="h-7 w-7 text-cyan-600" />
        <h1 className="text-2xl font-bold text-slate-900">My mail archive</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Gmail se delete ho chuki mail yahan backup se dikhti hai — live Gmail yahan open nahi hota.
        Kisi ko bhejne ke liye <strong>company mail se forward</strong> karein (reply company inbox par
        aayega).
      </p>
      <p className="mt-1 text-xs text-slate-500">Mailbox: {userEmail}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search subject, sender…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" size="sm" onClick={load}>Search</Button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
          {error.includes("disabled") && (
            <span> Admin: set ENABLE_EMAIL_BACKUP=1 and run Gmail sync.</span>
          )}
        </p>
      )}
      {forwardMsg && (
        <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {forwardMsg}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-slate-500">Loading archive…</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {emails.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{e.subject || "(no subject)"}</p>
              <p className="text-xs text-slate-500">
                {e.from_email} · {new Date(e.date).toLocaleString()}
                {e.has_attachment ? " · attachment" : ""}
              </p>
              {e.body_text && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{e.body_text}</p>
              )}
              {forwardId === e.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <label className="text-xs text-slate-500">Forward to (email)</label>
                    <Input
                      type="email"
                      value={forwardTo}
                      onChange={(ev) => setForwardTo(ev.target.value)}
                      placeholder="customer@example.com"
                      className="mt-1 max-w-xs"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={submitForward}>
                    Send via company mail
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setForwardId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1"
                  onClick={() => {
                    setForwardId(e.id);
                    setForwardTo("");
                    setForwardMsg("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> Forward from company mail
                </Button>
              )}
            </li>
          ))}
          {!emails.length && !error && (
            <li className="text-sm text-slate-500">
              Abhi koi archived mail nahi. Settings → Google connect, phir backup/sync chalao.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

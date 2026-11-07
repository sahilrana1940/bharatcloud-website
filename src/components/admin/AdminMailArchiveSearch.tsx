"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MailHit = {
  id: string;
  subject: string;
  from_email: string;
  to_email: string;
  company_from_email: string;
  received_at: string;
  snippet: string;
};

export function AdminMailArchiveSearch() {
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [word, setWord] = useState("");
  const [domain, setDomain] = useState("");
  const [mails, setMails] = useState<MailHit[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardMsg, setForwardMsg] = useState("");

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setForwardMsg("");
    const params = new URLSearchParams();
    if (email.trim()) params.set("email", email.trim());
    if (date) params.set("date", date);
    if (word.trim()) params.set("word", word.trim());
    const res = await fetch(`/api/company-admin/mails?${params}`, { credentials: "include" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 403) {
      setError("Only an admin can search this archive.");
      setMails([]);
      return;
    }
    if (!res.ok) {
      setError(body.error || "Search failed");
      setMails([]);
      return;
    }
    setDomain(body.domain || "");
    setMails(body.mails || []);
    if (body.migrationRequired) {
      setNotice("Archive table is not installed yet. Run the latest database migration.");
    } else if (!(body.mails || []).length) {
      setNotice("No company mail matched. Search covers the last 3 years.");
    }
  }

  async function forwardAgain(mail: MailHit) {
    setForwardMsg("");
    setError("");
    const res = await fetch("/api/company-admin/mails/forward", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailId: mail.id, to: forwardTo.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Forward failed");
      return;
    }
    setForwardMsg(body.message || `Forwarded again from ${mail.company_from_email}.`);
  }

  return (
    <section id="company-mail-archive" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <Search className="mt-1 h-4 w-4 text-cyan-700" />
        <div>
          <h2 className="font-bold text-cyan-700">Company mail archive</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            One copy of mail that came to your company domain, kept for 3 years.
            Search by email, date, or a word. Employees do not see this search.
          </p>
        </div>
      </div>

      <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="max-w-xs"
          aria-label="Search by email"
        />
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="max-w-[11rem]"
          aria-label="Search by date"
        />
        <Input
          value={word}
          onChange={(event) => setWord(event.target.value)}
          placeholder="Word in subject or body"
          className="max-w-xs"
          aria-label="Search by word"
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-3 text-sm text-slate-500">{notice}</p>}
      {forwardMsg && <p className="mt-3 text-sm text-emerald-700">{forwardMsg}</p>}

      <ul className="mt-4 space-y-3">
        {mails.map((mail) => (
          <li key={mail.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium text-slate-900">{mail.subject}</p>
            <p className="mt-1 text-xs text-slate-500">
              {mail.from_email || "Unknown sender"}
              {mail.to_email ? ` → ${mail.to_email}` : ""}
              {" · "}
              {mail.received_at ? new Date(mail.received_at).toLocaleString() : ""}
            </p>
            {mail.snippet && <p className="mt-2 text-sm text-slate-700">{mail.snippet}</p>}
            <p className="mt-2 text-xs text-slate-500">
              Sends from {mail.company_from_email}
              {domain ? ` · only @${domain}` : ""}
            </p>
            {openId === mail.id ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  value={forwardTo}
                  onChange={(event) => setForwardTo(event.target.value)}
                  placeholder={domain ? `name@${domain}` : "name@company.com"}
                  className="max-w-xs"
                  aria-label="Forward to company address"
                />
                <Button type="button" size="sm" onClick={() => forwardAgain(mail)}>
                  Forward Again to Our Domain
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setOpenId(mail.id);
                  setForwardTo("");
                  setForwardMsg("");
                }}
              >
                Forward Again to Our Domain
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

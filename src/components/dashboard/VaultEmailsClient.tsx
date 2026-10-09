"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mail = {
  id: string;
  owner_email: string;
  subject: string;
  from_email: string;
  date: string;
  has_attachment: boolean;
};

export function VaultEmailsClient({
  mode,
  isAdmin,
}: {
  mode: "vault" | "emails";
  isAdmin: boolean;
}) {
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [range, setRange] = useState("");
  const [attachment, setAttachment] = useState(false);
  const [emails, setEmails] = useState<Mail[]>([]);
  const [owners, setOwners] = useState<string[]>([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (owner) params.set("owner", owner);
    if (range) params.set("range", range);
    if (attachment) params.set("attachment", "1");
    const res = await fetch(`/api/emails/list?${params}`);
    const j = await res.json();
    setEmails(j.emails || []);
  }, [q, owner, range, attachment]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/team/users")
      .then((r) => r.json())
      .then((j) => {
        setOwners((j.users || []).map((u: { email: string }) => u.email));
      });
  }, []);

  async function restore(id: string) {
    await fetch("/api/emails/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId: id }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        {mode === "vault" ? "My Vault" : "Email backups"}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          placeholder='Search e.g. "challan"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        {isAdmin && (
          <select
            className="rounded-lg border px-3 text-sm"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="">All users</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}
        <select
          className="rounded-lg border px-3 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="">Any date</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7d">Last 7 days</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={attachment}
            onChange={(e) => setAttachment(e.target.checked)}
          />
          Has attachment
        </label>
        <Button type="button" size="sm" onClick={load}>Search</Button>
      </div>
      <ul className="mt-6 space-y-3">
        {emails.map((e) => (
          <li
            key={e.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-medium">{e.subject}</p>
            <p className="text-xs text-slate-500">
              {e.from_email} · {e.owner_email} ·{" "}
              {new Date(e.date).toLocaleString()}
              {e.has_attachment ? " · 📎" : ""}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2"
              variant="outline"
              onClick={() => restore(e.id)}
            >
              Restore to My Gmail
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { Globe2, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Discovered = {
  email: string;
  role?: string;
  saas_role?: string;
  is_backup_enabled?: boolean;
};

export function SettingsConnectDomain() {
  const [domain, setDomain] = useState("");
  const [emails, setEmails] = useState<Discovered[]>([]);
  const [mxHosts, setMxHosts] = useState<string[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/domain/discover-emails", { credentials: "include" });
      const j = await res.json();
      if (res.status === 403) {
        setLoading(false);
        return;
      }
      if (res.ok) {
        setDomain(j.domain || "");
        setEmails(j.emails || []);
        setMxHosts(j.mxHosts || []);
      } else {
        setMessage(j.error || "Could not load domain");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDomain() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/domain/discover-emails", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        addEmail: addEmail || undefined,
      }),
    });
    const j = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(j.error || "Save failed");
      return;
    }
    setEmails(j.emails || []);
    setAddEmail("");
    setMessage("Domain saved. Team page will list all *@" + j.domain + " accounts.");
    load();
  }

  if (!loading && !domain && !emails.length && !message) {
    return null;
  }

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-cyan-700">
        <Globe2 className="h-5 w-5" />
        <h2 className="text-lg font-semibold text-slate-900">Connect domain</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Any company — enter your work domain. We auto-list team mailboxes ending with{" "}
        <code className="rounded bg-slate-100 px-1">@{domain || "yourdomain.com"}</code> (GoDaddy /
        Google Workspace API placeholder for full auto-discovery).
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="text-slate-500">Company domain</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
          />
        </label>
        <button
          type="button"
          disabled={saving || !domain}
          onClick={saveDomain}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save domain"}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Add mailbox manually e.g. staff@domain.com"
          value={addEmail}
          onChange={(e) => setAddEmail(e.target.value)}
        />
        <button
          type="button"
          disabled={saving || !addEmail}
          onClick={saveDomain}
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <Plus className="h-4 w-4" /> Add email
        </button>
      </div>

      {mxHosts.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">MX: {mxHosts.join(", ")}</p>
      )}

      {message && <p className="mt-3 text-sm text-cyan-700">{message}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading directory…</p>
      ) : (
        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          {emails.map((e) => (
            <li key={e.email} className="rounded-lg bg-slate-50 px-3 py-2">
              {e.email}
              {e.is_backup_enabled === false ? " · backup off" : ""}
            </li>
          ))}
          {!emails.length && (
            <li className="text-slate-400">No mailboxes yet — save domain or add emails above.</li>
          )}
        </ul>
      )}
    </section>
  );
}

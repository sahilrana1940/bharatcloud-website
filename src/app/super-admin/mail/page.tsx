"use client";

import { useEffect, useState } from "react";

import { SaasShell } from "@/components/super-admin/SaasShell";
import { OWNER_EMAIL } from "@/lib/super-admin/locked-spec";

type Message = { id: string; from: string; subject: string; date: string; snippet: string; unread: boolean };
type Log = { id?: string; gmail_id?: string; from_email?: string; subject?: string; snippet?: string; read?: boolean; created_at?: string };

export default function MailControlPage() {
  const [tab, setTab] = useState<"inbox" | "logs">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [body, setBody] = useState("");

  function load() {
    fetch("/api/super-admin/mail", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (json.error) setError(json.error);
        setMessages(json.messages || []);
        setLogs(json.logs || []);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function mark(message: Message, unread: boolean) {
    await fetch("/api/super-admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id: message.id, unread }),
    });
    load();
  }

  async function sendReply() {
    if (!replyTo) return;
    const res = await fetch("/api/super-admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        id: replyTo.id,
        to: replyTo.from,
        subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
        body,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Reply failed");
      return;
    }
    setReplyTo(null);
    setBody("");
    load();
  }

  return (
    <SaasShell title="Mail Control">
      <p className="text-sm text-zinc-400">Mailbox {OWNER_EMAIL}</p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setTab("inbox")} className={`rounded-lg px-4 py-2 text-sm ${tab === "inbox" ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-300"}`}>Live Inbox</button>
        <button type="button" onClick={() => setTab("logs")} className={`rounded-lg px-4 py-2 text-sm ${tab === "logs" ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-300"}`}>Archive Logs</button>
      </div>

      {tab === "inbox" ? (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{message.subject || "(no subject)"}</p>
                  <p className="text-sm text-zinc-400">{message.from}</p>
                  <p className="mt-2 text-sm text-zinc-300">{message.snippet}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => mark(message, !message.unread)} className="rounded-lg border border-white/15 px-3 py-1 text-xs">
                    {message.unread ? "Mark Read" : "Mark Unread"}
                  </button>
                  <button type="button" onClick={() => setReplyTo(message)} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black">Reply</button>
                </div>
              </div>
            </li>
          ))}
          {!messages.length ? <li className="text-sm text-zinc-500">Inbox is empty or Gmail is not connected.</li> : null}
        </ul>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-zinc-400">
              <tr>
                {["From", "Subject", "Snippet", "Read"].map((head) => (
                  <th key={head} className="px-4 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.gmail_id || log.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{log.from_email}</td>
                  <td className="px-4 py-3">{log.subject}</td>
                  <td className="px-4 py-3">{log.snippet}</td>
                  <td className="px-4 py-3">{log.read ? "Read" : "Unread"}</td>
                </tr>
              ))}
              {!logs.length ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No archive rows in mail_logs.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {replyTo ? (
        <form
          className="mt-6 rounded-2xl border border-white/10 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            sendReply();
          }}
        >
          <p className="text-sm text-zinc-400">Reply to {replyTo.from}</p>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 h-28 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm" required />
          <button type="submit" className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white">Send reply</button>
        </form>
      ) : null}
    </SaasShell>
  );
}

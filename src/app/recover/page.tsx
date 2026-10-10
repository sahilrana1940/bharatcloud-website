"use client";

import Link from "next/link";
import { useState } from "react";

import { INDIA_BADGE } from "@/lib/storage/tiers";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("phone_lost");
  const [msg, setMsg] = useState("");

  async function submit() {
    const res = await fetch("/api/recovery/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, contact_mail: contact, reason }),
    });
    setMsg(res.ok ? "Request submitted — admin will email a code" : "Failed");
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-12 text-slate-100">
      <p className="text-center text-xs text-slate-500">{INDIA_BADGE}</p>
      <h1 className="mt-4 text-center text-2xl font-bold">Account recovery</h1>
      <div className="mx-auto mt-8 max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#1E2639] p-6">
        <input
          className="w-full rounded-lg bg-[#0A0E1A] px-3 py-2 text-sm"
          placeholder="Account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-[#0A0E1A] px-3 py-2 text-sm"
          placeholder="Contact email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <select
          className="w-full rounded-lg bg-[#0A0E1A] px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="phone_lost">Phone lost</option>
          <option value="new_phone">New phone</option>
        </select>
        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold"
        >
          Submit
        </button>
        {msg && <p className="text-sm text-cyan-300">{msg}</p>}
        <Link href="/recover/verify" className="block text-center text-sm text-slate-400">
          Already have a code? Verify →
        </Link>
      </div>
    </div>
  );
}

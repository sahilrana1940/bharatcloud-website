"use client";

import { useState } from "react";

export default function RecoverVerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function verify() {
    const res = await fetch("/api/recovery/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, code }),
    });
    const j = await res.json();
    if (res.ok) {
      const z = await fetch("/api/recovery/zip");
      const zj = await z.json();
      setMsg(`Verified — ${zj.files?.length ?? 0} files ready via signed URLs. Reset PIN in /personal`);
    } else setMsg(j.error);
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-12 text-slate-100">
      <h1 className="text-center text-2xl font-bold">Verify recovery code</h1>
      <div className="mx-auto mt-8 max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#1E2639] p-6">
        <input
          className="w-full rounded-lg bg-[#0A0E1A] px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-[#0A0E1A] px-3 py-2 text-sm"
          placeholder="8-digit code e.g. 4829-1092"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          type="button"
          onClick={verify}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold"
        >
          Verify
        </button>
        {msg && <p className="text-sm text-cyan-300">{msg}</p>}
      </div>
    </div>
  );
}

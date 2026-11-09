"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Login nahi hua.");
      return;
    }
    router.push("/hub");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-[#f6f3ec] px-5 text-[#1c1915]">
      <Link href="/" className="text-sm font-semibold">BharatCloud</Link>
      <h1 className="mt-6 text-3xl font-bold">Login</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-3xl bg-white p-5">
        <label className="block text-sm">Email
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-[#e6dccb] px-3 py-2" />
        </label>
        <label className="block text-sm">Password
          <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-[#e6dccb] px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-[#1c1915] py-3 text-sm font-semibold text-white">
          {busy ? "Login ho raha hai..." : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm">Naye partner? <Link href="/join" className="font-semibold">Partner Bano</Link></p>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
];

export default function JoinPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...Object.fromEntries(form.entries()) }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Register nahi hua.");
      return;
    }
    if (data.pending) {
      setPending("Request chali gayi. Super Admin WhatsApp se approve karega. Phir Login karo.");
      return;
    }
    router.push("/hub");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#f6f3ec] px-5 py-10 text-[#1c1915]">
      <Link href="/" className="text-sm font-semibold">BharatCloud</Link>
      <h1 className="mt-6 text-3xl font-bold">Partner Bano</h1>
      <p className="mt-2 text-sm text-[#5c5348]">Naam, mobile, WhatsApp, state aur city. India ke andar.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-3xl bg-white p-5">
        <Field name="name" label="Naam" />
        <Field name="email" label="Email" type="email" />
        <Field name="password" label="Password" type="password" />
        <Field name="mobile" label="Mobile" />
        <Field name="whatsapp" label="WhatsApp" />
        <label className="block text-sm">
          State
          <select name="state" required className="mt-1 w-full rounded-xl border border-[#e6dccb] px-3 py-2">
            <option value="">State choose karo</option>
            {STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <Field name="city" label="City" placeholder="Jammu, Delhi, Mumbai" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {pending ? <p className="text-sm text-[#0f6b4c]">{pending}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-[#c65d12] py-3 text-sm font-semibold text-white">
          {busy ? "Bhej rahe hain..." : "Request bhejo"}
        </button>
      </form>
      <p className="mt-4 text-sm">Pehle se ho? <Link href="/enter" className="font-semibold">Login</Link></p>
    </main>
  );
}

function Field({ name, label, type = "text", placeholder = "" }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} required placeholder={placeholder} className="mt-1 w-full rounded-xl border border-[#e6dccb] px-3 py-2" />
    </label>
  );
}

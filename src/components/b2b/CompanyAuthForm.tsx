"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { SiteHeader } from "@/components/b2b/SiteHeader";

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const path =
      mode === "register" ? "/api/b2b/auth/register" : "/api/b2b/auth/login";
    const body =
      mode === "register"
        ? { companyName, email, password }
        : { email, password };
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(j.error || "Something went wrong");
      return;
    }
    router.push("/b2b/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="minimal" />
      <div className="mx-auto flex max-w-md flex-col px-6 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">
          {mode === "register" ? "Register your company" : "Company admin login"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage team storage — BharatCloud by Bharat Tijori
        </p>

        <div className="mt-6 flex gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              mode === "login" ? "bg-[#ff6a00] text-white" : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              mode === "register" ? "bg-[#ff6a00] text-white" : "text-gray-600"
            }`}
          >
            Register
          </button>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {mode === "register" && (
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          )}
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="w-full rounded-full bg-[#ff6a00] py-2.5 text-sm font-semibold text-white hover:bg-[#e55f00] disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "register"
                ? "Create organization"
                : "Login to dashboard"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <Link href="/" className="mt-6 text-center text-sm text-[#ff6a00] hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export function CompanyAuthForm() {
  return (
    <Suspense>
      <AuthInner />
    </Suspense>
  );
}

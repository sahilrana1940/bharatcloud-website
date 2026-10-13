"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/b2b/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(j.error || "Login failed");
      return;
    }
    router.push(typeof j.redirectTo === "string" ? j.redirectTo : "/dashboard");
  }

  function googleLogin() {
    window.location.href = "/api/auth/google";
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-11 border-slate-200 bg-slate-50/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 border-slate-200 bg-slate-50/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in to workspace"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-white px-2 text-slate-400">Or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={googleLogin}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:bg-slate-50"
      >
        Continue with Google Workspace
      </button>

      <p className="mt-8 text-center text-sm text-slate-500">
        New company?{" "}
        <Link href="/signup" className="font-semibold text-cyan-700 hover:underline">
          Create account
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/recover" className="font-semibold text-cyan-700 hover:underline">
          Account recovery
        </Link>
      </p>
    </div>
  );
}

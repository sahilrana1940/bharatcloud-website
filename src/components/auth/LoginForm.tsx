"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
    router.push("/dashboard/drive");
  }

  function googleLogin() {
    window.location.href = "/api/auth/google";
  }

  function googleDemo() {
    window.location.href = "/api/auth/google/demo?email=admin@rjadam.com";
  }

  function personalDemo() {
    window.location.href =
      "/api/auth/google/demo?email=demo.user@gmail.com&mode=b2c";
  }

  function superAdminDemo() {
    window.location.href =
      "/api/auth/google/demo?email=admin@bharatcloud.store";
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Sign in to your company workspace
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 dark:bg-slate-950">
            Or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-slate-200 text-slate-800 dark:border-slate-600 dark:text-slate-100"
        onClick={googleLogin}
      >
        Continue with Google Workspace
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="mt-2 w-full text-xs text-slate-500"
        onClick={googleDemo}
      >
        Demo B2B workspace (rjadam.com)
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="mt-1 w-full text-xs text-cyan-600"
        onClick={personalDemo}
      >
        Personal HD Cloud (B2C demo — not your company)
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="mt-1 w-full text-xs text-slate-400"
        onClick={superAdminDemo}
      >
        Super Admin demo
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-sky-600 hover:underline">
          Create account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-slate-500">
        Lost phone or PIN?{" "}
        <Link href="/recover" className="font-medium text-sky-600 hover:underline">
          Account recovery
        </Link>
      </p>
    </div>
  );
}

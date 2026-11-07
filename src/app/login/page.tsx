"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("support@bharatcloud.store");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json()) as { 
        error?: string; 
        code?: string; 
        redirectTo?: string 
      };

      if (!res.ok) {
        // 401 ko error mat samjho, sirf user ko dikhao
        if (res.status === 401) {
          setError(data.error || "Wrong password");
        } else {
          // Asli server error tabhi console me dikhao
          console.error("[login]", { status: res.status, error: data.error, code: data.code });
          setError(data.error || "Login failed");
        }
        return;
      }

      // Success
      router.push(data.redirectTo || "/dashboard");

    } catch (err) {
      console.error("[login] network error", err);
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleLogin} className="w-[400px] p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h1 className="text-3xl font-bold text-white">Login</h1>
        <p className="text-zinc-400 mt-2 mb-6">Sign in to your BharatCloud workspace.</p>

        <label className="text-white text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-2 mb-4 p-3 rounded-xl bg-white text-black"
        />

        <label className="text-white text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-2 mb-4 p-3 rounded-xl bg-zinc-800 text-white border border-zinc-700"
        />

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Checking..." : "Login"}
        </button>

        <p className="text-center text-zinc-400 text-sm mt-4">
          Don&apos;t have an account? <a href="/signup" className="text-orange-400">Sign Up</a>
        </p>
      </form>
    </div>
  );
}
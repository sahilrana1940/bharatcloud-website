"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { Building2, CalendarClock, CreditCard, Hash, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { firebaseAuthConfigured, getPartnerAuth } from "@/lib/firebase/partner-auth";
import type { PartnerDashboard as PartnerData } from "@/lib/partner/load-partner";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "paid" || value === "active" || value === "success") {
    return "bg-blue-600 text-white";
  }
  return "bg-orange-500 text-white";
}

export function PartnerDashboard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partner, setPartner] = useState<PartnerData | null>(null);

  useEffect(() => {
    if (!firebaseAuthConfigured()) {
      setReady(true);
      setError("Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID to enable partner login.");
      return;
    }
    return onAuthStateChanged(getPartnerAuth(), (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setPartner(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    user
      .getIdToken()
      .then((token) =>
        fetch("/api/partner/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load partner");
        if (!cancelled) setPartner(body as PartnerData);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load partner");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signInWithEmailAndPassword(getPartnerAuth(), email.trim(), password);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      setError(
        code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found"
          ? "Email or password is incorrect"
          : "Partner login failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    await signOut(getPartnerAuth());
    setPassword("");
  }

  return (
    <div className="min-h-screen bg-[#eef4ff] text-[#0f2744]">
      <header className="border-b-4 border-orange-500 bg-[#0b3a82] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
              B2B only
            </p>
            <h1 className="text-lg font-bold sm:text-2xl">Partner Dashboard</h1>
          </div>
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-100"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {!ready ? (
          <p className="text-sm text-slate-600">Checking partner session…</p>
        ) : !user ? (
          <form
            onSubmit={onLogin}
            className="mx-auto w-full max-w-md rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_16px_40px_rgba(11,58,130,0.12)] sm:p-8"
          >
            <h2 className="text-xl font-bold text-[#0b3a82]">Partner login</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Business partners only. Sign in with your Firebase account. Personal accounts are not supported.
            </p>
            <label className="mt-6 block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-blue-100 px-3 py-3 text-base outline-none ring-orange-400/30 focus:ring-2"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-blue-100 px-3 py-3 text-base outline-none ring-orange-400/30 focus:ring-2"
              />
            </label>
            {error ? <p className="mt-4 text-sm font-medium text-orange-700">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Login"}
            </button>
          </form>
        ) : loading ? (
          <p className="text-sm text-slate-600">Loading partner details…</p>
        ) : error ? (
          <div className="rounded-3xl border border-orange-200 bg-white p-5">
            <p className="font-semibold text-orange-700">{error}</p>
            <p className="mt-2 text-sm text-slate-600">Signed in as {user.email}</p>
          </div>
        ) : partner ? (
          <section>
            <p className="text-sm text-slate-500">Signed in as {user.email}</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0b3a82] sm:text-3xl">{partner.partnerName}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Stat icon={Building2} label="Company Name" value={partner.companyName} />
              <Stat icon={Hash} label="Total IDs" value={String(partner.totalIds)} />
              <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  Payment Status
                </div>
                <p className="mt-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusClass(partner.paymentStatus)}`}>
                    {partner.paymentStatus}
                  </span>
                </p>
              </article>
              <Stat icon={CalendarClock} label="Renewal Date" value={formatDate(partner.renewalDate)} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon className="h-4 w-4 text-orange-500" />
        {label}
      </div>
      <p className="mt-3 break-words text-xl font-semibold text-[#0b3a82]">{value}</p>
    </article>
  );
}

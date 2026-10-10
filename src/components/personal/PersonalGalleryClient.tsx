"use client";

import { useCallback, useEffect, useState } from "react";

import { VaultGallery } from "@/components/personal/VaultGallery";
import { Toast } from "@/components/dashboard/Toast";
import { BRAND_FOOTER } from "@/lib/brand";

const UNLOCK_KEY = "vault_unlocked";
const UNLOCK_MS = 5 * 60 * 1000;

export function PersonalGalleryClient() {
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [tab, setTab] = useState("photo");
  const [plan, setPlan] = useState<{ storage_used?: number; storage_limit?: number } | null>(null);
  const [toast, setToast] = useState("");

  const checkSessionUnlock = useCallback(() => {
    const raw = sessionStorage.getItem(UNLOCK_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (Date.now() > t) {
      sessionStorage.removeItem(UNLOCK_KEY);
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    fetch("/api/personal/pin").then((r) => r.json()).then((j) => {
      setHasPin(j.hasPin);
      if (checkSessionUnlock()) setUnlocked(true);
    });
    fetch("/api/personal/list?page=1").then((r) => r.json()).then((j) => setPlan(j.plan));
  }, [checkSessionUnlock]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function verifyPin() {
    if (Date.now() < lockedUntil) {
      return notify("Wait 1 min after 3 wrong attempts");
    }
    const res = await fetch("/api/personal/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pin: pinInput }),
    });
    if (res.ok) {
      setUnlocked(true);
      sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MS));
      setFailures(0);
    } else {
      const f = failures + 1;
      setFailures(f);
      if (f >= 3) {
        setLockedUntil(Date.now() + 60_000);
        setFailures(0);
        notify("Locked 1 minute");
      } else notify("Wrong PIN");
    }
  }

  async function setup() {
    const res = await fetch("/api/personal/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup", pin: setupPin }),
    });
    const j = await res.json();
    if (res.ok) {
      setHasPin(true);
      setUnlocked(true);
      setBackupCode(j.backupWords);
      sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MS));
    }
  }

  async function buy(planId: string) {
    const res = await fetch("/api/payments/yearly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const j = await res.json();
    if (j.razorpayOrder) {
      notify("Open Razorpay checkout (configure keys)");
      return;
    }
    await fetch("/api/payment-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    notify("Plan activated");
  }

  const used = ((plan?.storage_used ?? 0) / 1024 ** 3).toFixed(1);
  const limit = ((plan?.storage_limit ?? 2 * 1024 ** 3) / 1024 ** 3).toFixed(0);

  if (!hasPin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#1E2639] p-6">
          <h1 className="text-xl font-bold text-white">Set 6-digit PIN</h1>
          <input
            maxLength={6}
            value={setupPin}
            onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
            className="mt-4 w-full rounded-lg bg-[#0A0E1A] px-3 py-3 text-center text-2xl tracking-widest text-white"
          />
          <button type="button" onClick={setup} className="mt-4 w-full rounded-xl bg-cyan-500 py-3 font-semibold text-white">
            Save PIN + Backup Code
          </button>
          {backupCode && <p className="mt-3 text-xs text-amber-200">Show once: {backupCode}</p>}
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#1E2639] p-6 text-center">
          <h1 className="text-xl font-bold text-white">Enter PIN</h1>
          <input
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            className="mt-4 w-full rounded-lg bg-[#0A0E1A] px-3 py-3 text-center text-2xl tracking-widest text-white"
          />
          <button type="button" onClick={verifyPin} className="mt-4 w-full rounded-xl bg-cyan-500 py-3 font-semibold text-white">
            Unlock vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-[140px] pt-4 sm:px-8">
      <div className="rounded-xl bg-[#1E2639] px-3 py-2 text-center text-[11px] text-slate-300">
        🇮🇳 BharatCloud | Data in Mumbai | {used}GB/{limit}GB FREE — 20GB @199/year{" "}
        <button type="button" onClick={() => buy("year_20gb")} className="font-bold text-cyan-400">BUY NOW</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["photo", "video", "whatsapp", "qr"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs ${tab === t ? "bg-cyan-600 text-white" : "bg-[#1E2639] text-slate-400"}`}
          >
            {t === "photo" ? "Photos 🔥" : t === "qr" ? "QR Share" : t}
          </button>
        ))}
      </div>

      {tab === "qr" ? (
        <p className="mt-8 text-center text-slate-400">QR share — signed links only (60s)</p>
      ) : (
        <div className="mt-6">
          <VaultGallery typeFilter={tab} />
        </div>
      )}

      <button
        type="button"
        className="mt-8 text-sm text-red-300"
        onClick={async () => {
          await fetch("/api/personal/pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "lock_device" }),
          });
          sessionStorage.removeItem(UNLOCK_KEY);
          setUnlocked(false);
          notify("Lost phone reported — device locked");
        }}
      >
        Lost Phone
      </button>
      <p className="mt-6 text-center text-[10px] text-slate-600">{BRAND_FOOTER}</p>
      <Toast message={toast} />
    </div>
  );
}

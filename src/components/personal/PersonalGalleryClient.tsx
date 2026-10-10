"use client";

import { Lock, QrCode, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";
import { INDIA_BADGE } from "@/lib/storage/tiers";

type Item = {
  id: string;
  file_name: string;
  file_size: number;
  type: string;
  storage_tier: "hot" | "cold";
  is_deleted: boolean;
};

type Plan = {
  storage_used_bytes?: number;
  storage_limit_bytes?: number;
  plan?: string;
  plan_expires_at?: string | null;
};

const TABS = [
  { id: "photo", label: "Photos 🔥" },
  { id: "video", label: "Videos" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "qr", label: "QR Share" },
] as const;

export function PersonalGalleryClient() {
  const [tab, setTab] = useState<string>("photo");
  const [items, setItems] = useState<Item[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [backupWords, setBackupWords] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMeta = useCallback(async () => {
    const pinRes = await fetch("/api/personal/pin");
    const pinJ = await pinRes.json();
    setHasPin(pinJ.hasPin);
    if (pinJ.is_device_locked) setUnlocked(false);
  }, []);

  const load = useCallback(async () => {
    if (tab === "qr") return;
    const res = await fetch(`/api/personal/list?type=${tab}`);
    const j = await res.json();
    setItems(j.items || []);
    setPlan(j.plan || null);
  }, [tab]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    load();
  }, [load]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function verifyPin() {
    const res = await fetch("/api/personal/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pin: pinInput }),
    });
    if (res.ok) {
      setUnlocked(true);
      notify("Vault unlocked");
    } else notify("Wrong PIN");
  }

  async function setupPinFlow() {
    const res = await fetch("/api/personal/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup", pin: setupPin }),
    });
    const j = await res.json();
    if (res.ok) {
      setHasPin(true);
      setUnlocked(true);
      setBackupWords(j.backupWords);
      notify("PIN set — save backup words");
    }
  }

  async function openItem(id: string) {
    if (!unlocked && hasPin) return notify("Enter PIN first");
    const res = await fetch(`/api/secure-download/${id}`);
    const j = await res.json();
    if (!res.ok) return notify(j.error || "Cannot open");
    setPreview(j.signedUrl || j.url);
  }

  async function onUpload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("type", tab === "video" ? "video" : "photo");
      const res = await fetch("/api/vault-upload", { method: "POST", body: fd });
      if (!res.ok) notify("Upload failed");
    }
    notify("HD saved to HOT + VAULT");
    load();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function softDelete(id: string) {
    await fetch("/api/personal/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    notify("Soft deleted — vault copy kept");
    load();
  }

  async function buyPlan(p: string) {
    const res = await fetch("/api/payments/yearly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: p }),
    });
    const j = await res.json();
    notify(j.message || (res.ok ? "Plan updated" : "Payment failed"));
    load();
  }

  const used = plan?.storage_used_bytes ?? 0;
  const limit = plan?.storage_limit_bytes ?? 2 * 1024 ** 3;
  const usedGb = (used / 1024 ** 3).toFixed(1);
  const limitGb = (limit / 1024 ** 3).toFixed(0);

  if (!hasPin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1E2639] p-6">
          <p className="text-xs text-slate-500">{INDIA_BADGE}</p>
          <h1 className="mt-2 text-xl font-bold text-white">Set 6-digit PIN</h1>
          <input
            maxLength={6}
            value={setupPin}
            onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
            className="mt-4 w-full rounded-lg bg-[#0A0E1A] px-3 py-3 text-center text-2xl tracking-widest text-white"
          />
          <button
            type="button"
            onClick={setupPinFlow}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold text-white"
          >
            Create PIN + Backup Code
          </button>
          {backupWords && (
            <p className="mt-4 rounded-lg bg-amber-950/40 p-3 text-xs text-amber-200">
              Save once: {backupWords}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1E2639] p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-cyan-400" />
          <h1 className="mt-2 text-xl font-bold text-white">Vault locked</h1>
          <input
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            className="mt-4 w-full rounded-lg bg-[#0A0E1A] px-3 py-3 text-center text-2xl tracking-widest text-white"
          />
          <button
            type="button"
            onClick={verifyPin}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold text-white"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <p className="text-center text-[10px] text-slate-500">{INDIA_BADGE}</p>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Personal HD Cloud</h1>
        <span className="rounded-full bg-violet-900/50 px-2 py-1 text-[10px] text-violet-200">
          Vault Status 🔒
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-[#1E2639] p-3">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{usedGb}GB / {limitGb}GB (FREE)</span>
          <span>20GB @ ₹199/yr</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
            style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => buyPlan("year_20gb")} className="text-xs text-cyan-400">
            Buy 20GB
          </button>
          <button type="button" onClick={() => buyPlan("year_100gb")} className="text-xs text-slate-400">
            100GB ₹499
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              tab === t.id ? "bg-cyan-600 text-white" : "bg-[#1E2639] text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "qr" ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-white/10 bg-[#1E2639] p-8">
          <QrCode className="h-16 w-16 text-cyan-400" />
          <p className="mt-4 text-sm text-slate-300">Share vault link via QR (signed 60s)</p>
          <p className="mt-2 text-xs text-slate-500">https://www.bharatcloud.store/personal</p>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white sm:w-auto sm:px-8"
          >
            <Upload className="h-4 w-4" /> Upload HD original
          </button>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
                <button
                  type="button"
                  className="relative block h-[180px] w-full bg-[#151b2e] blur-0"
                  onClick={() => openItem(item.id)}
                >
                  <span className="absolute left-2 top-2 rounded-full bg-orange-900/60 px-2 py-0.5 text-[10px] text-orange-200">
                    {item.storage_tier === "cold" ? "COLD ❄️" : "HOT 🔥"} HD
                  </span>
                </button>
                <div className="p-4">
                  <p className="truncate font-bold text-slate-100">{item.file_name}</p>
                  <button
                    type="button"
                    onClick={() => softDelete(item.id)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm text-red-300"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className="mt-8 text-sm text-slate-500"
        onClick={async () => {
          await fetch("/api/personal/pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "lock_device" }),
          });
          setUnlocked(false);
          notify("Reported lost phone — device locked");
        }}
      >
        Report lost phone
      </button>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setPreview(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}

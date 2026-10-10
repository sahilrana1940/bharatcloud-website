"use client";

import { useState } from "react";
import { Shield, Video } from "lucide-react";

import { VaultGallery } from "@/components/personal/VaultGallery";
import { VaultUploadBar } from "@/components/personal/VaultUploadBar";

export function EmployeeUploadClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-sky-950/80 via-[#0f1420] to-cyan-950/50 p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-cyan-500/30">
            <Video className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload CCTV / Video</h1>
            <p className="mt-1 text-sm text-slate-400">
              HD files → company hot storage + encrypted vault · India-first
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-cyan-400/90">
          <Shield className="h-3.5 w-3.5" />
          Signed URLs only — no public links
        </p>
      </div>

      <div className="mt-8">
        <VaultUploadBar type="video" onDone={() => setRefreshKey((k) => k + 1)} />
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Your uploads
        </h2>
        <VaultGallery refreshKey={refreshKey} />
      </div>
    </div>
  );
}

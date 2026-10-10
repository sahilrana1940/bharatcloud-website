"use client";

import { useState } from "react";

import { VaultGallery } from "@/components/personal/VaultGallery";
import { VaultUploadBar } from "@/components/personal/VaultUploadBar";

export function EmployeeUploadClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <h1 className="text-2xl font-bold text-white">Upload CCTV / Video</h1>
      <p className="text-sm text-slate-500">HD → company hot + vault (signed URLs only)</p>
      <div className="mt-6">
        <VaultUploadBar type="video" onDone={() => setRefreshKey((k) => k + 1)} />
        <VaultGallery refreshKey={refreshKey} />
      </div>
    </div>
  );
}

"use client";

import { VaultGallery } from "@/components/personal/VaultGallery";

export function EmployeeVaultClient({ userEmail }: { userEmail: string }) {
  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <h1 className="text-2xl font-bold text-white">Company vault</h1>
      <p className="text-sm text-slate-500">Signed URLs for {userEmail} — thumbnails in gallery</p>
      <div className="mt-6">
        <VaultGallery />
      </div>
    </div>
  );
}

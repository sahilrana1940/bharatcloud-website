"use client";

import Link from "next/link";
import { Search, Upload } from "lucide-react";

import { VaultGallery } from "@/components/personal/VaultGallery";

export function EmployeeDashboardClient() {
  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-8 sm:px-8">
      <h1 className="text-2xl font-bold text-[#10243E]">Employee workspace</h1>
      <p className="text-slate-600">Upload CCTV and search the E2E vault (read-only). Site runs on Hostinger.</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/employee/upload"
          className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#00BAF2] p-6 text-center font-semibold text-[#062033] shadow-lg shadow-[#00BAF2]/30"
        >
          <Upload className="h-10 w-10" />
          Upload CCTV / Video
        </Link>
        <Link
          href="/dashboard/employee/vault"
          className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#10243E]/10 bg-white p-6 text-center font-semibold text-[#10243E] shadow-sm"
        >
          <Search className="h-10 w-10 text-[#0F766E]" />
          Search Vault
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-[#10243E]">My uploads</h2>
        <VaultGallery />
      </div>
    </div>
  );
}

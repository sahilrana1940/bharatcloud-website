"use client";

import Link from "next/link";
import { Search, Upload } from "lucide-react";

import { DriveShell } from "@/components/dashboard/DriveShell";

export function EmployeeDashboardClient({ userEmail }: { userEmail: string }) {
  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-8 sm:px-8">
      <h1 className="text-2xl font-bold text-white">Employee workspace</h1>
      <p className="text-slate-500">Upload CCTV and search company vault (read-only)</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/employee/upload"
          className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-center font-semibold text-white shadow-lg shadow-sky-500/20"
        >
          <Upload className="h-10 w-10" />
          Upload CCTV / Video
        </Link>
        <Link
          href="/dashboard/employee/vault"
          className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1E2639] p-6 text-center font-semibold text-slate-100"
        >
          <Search className="h-10 w-10 text-cyan-400" />
          Search Vault
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-white">My uploads</h2>
        <DriveShell
          userEmail={userEmail}
          listSource="my-uploads"
          showUpload={false}
          title=""
          subtitle=""
          embedded
        />
      </div>
    </div>
  );
}

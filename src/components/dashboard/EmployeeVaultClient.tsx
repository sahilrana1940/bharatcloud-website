"use client";

import { EmployeeBackupVault } from "@/components/dashboard/EmployeeBackupVault";

export function EmployeeVaultClient({ userEmail }: { userEmail: string }) {
  return (
    <div className="min-h-screen overflow-y-auto px-4 pb-24 pt-6 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-900">My backup vault</h1>
      <p className="mt-1 text-sm text-slate-600">
        Yahan aapki Google Drive archive files dikhti hain — company owner ki alag view hoti hai.
      </p>
      <div className="mt-6">
        <EmployeeBackupVault userEmail={userEmail} />
      </div>
    </div>
  );
}

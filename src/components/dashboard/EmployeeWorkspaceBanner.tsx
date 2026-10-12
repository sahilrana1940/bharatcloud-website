"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import type { TenantProfile } from "@/lib/tenant-profile";
import { formatTenantAddress } from "@/lib/tenant-profile";

export function EmployeeWorkspaceBanner() {
  const [meta, setMeta] = useState<{
    domain: string;
    profile: TenantProfile | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j.domain) setMeta({ domain: j.domain, profile: j.profile });
      })
      .catch(() => undefined);
  }, []);

  if (!meta) return null;

  const title = meta.profile?.legalName ?? meta.domain;

  return (
    <div className="mb-6 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50/90 to-white px-4 py-3 text-sm shadow-sm">
      <p className="font-semibold text-slate-800">{title}</p>
      {meta.profile && (
        <p className="mt-1 flex items-start gap-1.5 text-slate-600">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
          <span>{formatTenantAddress(meta.profile)}</span>
        </p>
      )}
    </div>
  );
}

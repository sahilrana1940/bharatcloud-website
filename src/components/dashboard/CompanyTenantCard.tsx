import { MapPin, Phone, Mail, Globe } from "lucide-react";

import { GlassPanel } from "@/components/ui/pro/primitives";
import type { TenantProfile } from "@/lib/tenant-profile";
import { formatTenantAddress } from "@/lib/tenant-profile";

export function CompanyTenantCard({
  domain,
  adminEmail,
  profile,
}: {
  domain: string;
  adminEmail: string;
  profile: TenantProfile | null;
}) {
  return (
    <GlassPanel className="mb-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">
            Registered workspace
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {profile?.legalName ?? domain}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{domain}</p>
          <p className="mt-2 text-sm text-slate-600">
            Owner / admin login:{" "}
            <span className="font-medium text-slate-800">{adminEmail}</span>
          </p>
        </div>
        {profile && (
          <div className="min-w-0 max-w-md text-sm text-slate-600">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
              <span>{formatTenantAddress(profile)}</span>
            </p>
            {profile.phone && (
              <p className="mt-2 flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-cyan-600" />
                <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="hover:text-cyan-700">
                  {profile.phone}
                </a>
              </p>
            )}
            {profile.publicEmail && (
              <p className="mt-2 flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-cyan-600" />
                <span>{profile.publicEmail}</span>
              </p>
            )}
            {profile.website && (
              <p className="mt-2 flex gap-2">
                <Globe className="h-4 w-4 shrink-0 text-cyan-600" />
                <a href={profile.website} className="truncate hover:text-cyan-700" target="_blank" rel="noreferrer">
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

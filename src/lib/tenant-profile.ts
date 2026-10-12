/** Optional marketing / handoff profile keyed by company domain (not stored in DB). */
export type TenantProfile = {
  legalName: string;
  addressLines: string[];
  cityStatePin: string;
  phone?: string;
  publicEmail?: string;
  website?: string;
  /** Handoff checklist: up to 3 staff emails (invite on Team if not in DB yet). */
  handoffStaffEmails?: string[];
};

const PROFILES: Record<string, TenantProfile> = {
  "gorjrmcourier.com": {
    legalName: "GOR JRM Courier (RJRM Logistics)",
    addressLines: ["Bus Stand, near Honda Agency"],
    cityStatePin: "Sunderbani, Jammu & Kashmir 185153, India",
    phone: "+91 99888 64626",
    publicEmail: "info@gorjrmcourier.com",
    website: "https://www.gorjrmcourier.com",
    handoffStaffEmails: [
      "sunderbanihub@gorjrmcourier.com",
      "nowsheraodh@gorjrmcourier.com",
      "rajouriodh@gorjrmcourier.com",
    ],
  },
};

export function getTenantHandoffStaff(domain: string | null | undefined): string[] {
  const profile = getTenantProfile(domain);
  return profile?.handoffStaffEmails?.slice(0, 3) ?? [];
}

export function getTenantProfile(domain: string | null | undefined): TenantProfile | null {
  if (!domain) return null;
  const key = domain.toLowerCase().replace(/^www\./, "");
  return PROFILES[key] ?? null;
}

export function formatTenantAddress(profile: TenantProfile): string {
  return [...profile.addressLines, profile.cityStatePin].join(", ");
}

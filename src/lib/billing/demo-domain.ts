import { getTenantProfile } from "@/lib/tenant-profile";

function parseDemoDomainEnv(): Set<string> {
  const raw = process.env.DEMO_BYPASS_DOMAINS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((d) => d.trim().toLowerCase().replace(/^www\./, ""))
      .filter(Boolean),
  );
}

/** Demo / handoff tenants: Drive backup works without Razorpay (env list or tenant profile flag). */
export function isDemoBillingDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  const key = domain.toLowerCase().replace(/^www\./, "");
  if (parseDemoDomainEnv().has(key)) return true;
  const profile = getTenantProfile(key);
  return Boolean(profile?.demoBillingUnlocked);
}

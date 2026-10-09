import { GB } from "@/lib/b2b/plans";
import type { Organization, OrgMember } from "@/lib/supabase/server";

export const demoOrganizations: Organization[] = [
  {
    id: "demo-org-001",
    name: "RJ Adam Pvt Ltd",
    owner_email: "admin@rjadam.com",
    owner_phone: "+919876543210",
    plan: "starter",
    storage_limit: 100 * GB,
    storage_used: 5 * GB,
    status: "active",
    created_at: new Date().toISOString(),
  },
];

export const demoMembers: OrgMember[] = [
  {
    id: "demo-member-1",
    org_id: "demo-org-001",
    user_email: "admin@rjadam.com",
    role: "admin",
    joined_at: new Date().toISOString(),
  },
];

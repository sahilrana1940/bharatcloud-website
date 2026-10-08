import { createClient } from "@supabase/supabase-js";

export type Organization = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  storage_limit: number;
  storage_used: number;
  status: "active" | "blocked";
  created_at: string;
};

export type OrgMember = {
  id: string;
  org_id: string;
  user_email: string;
  role: string;
  joined_at: string;
};

export type B2BCompany = {
  id: string;
  name: string;
  plan: "500gb" | "1tb";
  storage_limit_gb: number;
  created_at: string;
};

export type B2BId = {
  id: string;
  company_id: string;
  email_prefix: string;
  storage_used_gb: number;
  last_active_at: string;
  s3_prefix: string;
};

export type VaultTrashRow = {
  id: string;
  company_id: string;
  file_key: string;
  original_name: string;
  deleted_at: string;
  s3_version_id: string | null;
  trash_key: string;
};

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Demo company when Supabase is not configured (local dev). */
export const DEMO_COMPANY: B2BCompany = {
  id: "demo-company-001",
  name: "RJ Adam Pvt Ltd",
  plan: "500gb",
  storage_limit_gb: 500,
  created_at: new Date().toISOString(),
};

export const DEMO_IDS: B2BId[] = [
  {
    id: "demo-id-1",
    company_id: DEMO_COMPANY.id,
    email_prefix: "accounts@rjadam.com",
    storage_used_gb: 40,
    last_active_at: new Date().toISOString(),
    s3_prefix: "b2b/demo-company-001/accounts/",
  },
];

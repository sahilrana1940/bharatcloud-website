import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CompanyRow = {
  id: string;
  domain: string;
  admin_email: string;
  plan_name: string;
  storage_limit_gb: number;
};

export type CompanyUserRow = {
  id: string;
  company_id: string;
  email: string;
  role: "admin" | "member";
  is_backup_enabled: boolean;
  drive_used_gb: number;
  drive_limit_gb: number;
};

export async function getSupabaseOrNull() {
  return getSupabaseAdmin();
}

import { NextRequest, NextResponse } from "next/server";

import {
  addMemoryEmployee,
  COMMAND_EMPLOYEE,
  deleteMemoryEmployee,
  listMemoryEmployees,
  type AdminEmployee,
} from "@/lib/super-admin/command-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";
const HOME_DOMAIN = "bharatcloud.store";

const noStore = { "Cache-Control": "no-store" };

function cookieEmail(req: NextRequest) {
  return req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
}

function canAct(req: NextRequest) {
  const header = req.headers.get("x-admin-email")?.toLowerCase() || "";
  return header === SUPER_ADMIN_EMAIL && cookieEmail(req) === SUPER_ADMIN_EMAIL;
}

function deny() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
}

function mapRole(role: string) {
  const value = role.trim().toLowerCase();
  if (value === "admin") return "admin";
  if (value === "employee" || value === "member") return "member";
  return null;
}

function displayRole(role: string) {
  return role === "admin" ? "ADMIN" : "EMPLOYEE";
}

function fromDb(row: { id: string; email: string; role: string }): AdminEmployee {
  return {
    id: row.id,
    name: String(row.email).split("@")[0] || "Employee",
    email: row.email,
    role: displayRole(row.role),
    lastAction: "Added by support@bharatcloud.store",
    status: "ACTIVE",
  };
}

async function homeCompanyId() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { supabase: null, companyId: null as string | null };
  const { data } = await supabase.from("companies").select("id").eq("domain", HOME_DOMAIN).maybeSingle();
  return { supabase, companyId: (data?.id as string) || null };
}

export async function GET(req: NextRequest) {
  if (cookieEmail(req) !== SUPER_ADMIN_EMAIL) return deny();

  const { supabase, companyId } = await homeCompanyId();
  if (!supabase || !companyId) {
    return NextResponse.json(listMemoryEmployees(), { headers: noStore });
  }

  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, role")
    .eq("company_id", companyId)
    .order("email", { ascending: true });

  if (error) return NextResponse.json(listMemoryEmployees(), { headers: noStore });

  const rows = (data || [])
    .filter((row) => String(row.email).toLowerCase() !== SUPER_ADMIN_EMAIL)
    .map(fromDb);
  return NextResponse.json([COMMAND_EMPLOYEE, ...rows], { headers: noStore });
}

export async function POST(req: NextRequest) {
  if (!canAct(req)) return deny();

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim();
  const role = mapRole(String(body?.role || "Employee"));
  if (!email || !email.includes("@") || !role) {
    return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400, headers: noStore });
  }
  if (email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Super admin already exists" }, { status: 400, headers: noStore });
  }

  const { supabase, companyId } = await homeCompanyId();
  if (supabase && companyId) {
    const { data, error } = await supabase
      .from("company_users")
      .insert({
        company_id: companyId,
        email,
        role,
        is_backup_enabled: false,
        drive_used_gb: 0,
        drive_limit_gb: 0,
      })
      .select("id, email, role")
      .single();
    if (!error && data) {
      const row = fromDb(data);
      if (name) row.name = name;
      return NextResponse.json(row, { headers: noStore });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  }

  const row: AdminEmployee = {
    id: `EMP-${Date.now().toString().slice(-4)}`,
    name: name || email.split("@")[0],
    email,
    role: displayRole(role || "member"),
    lastAction: "Added by support@bharatcloud.store",
    status: "ACTIVE",
  };
  addMemoryEmployee(row);
  return NextResponse.json(row, { headers: noStore });
}

export async function DELETE(req: NextRequest) {
  if (!canAct(req)) return deny();

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || "");
  const email = String(body?.email || "").toLowerCase();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: noStore });
  if (id === COMMAND_EMPLOYEE.id || email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot delete support@bharatcloud.store" }, { status: 400, headers: noStore });
  }

  const { supabase } = await homeCompanyId();
  if (supabase && !id.startsWith("EMP-")) {
    const { error } = await supabase.from("company_users").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  } else {
    deleteMemoryEmployee(id);
  }

  return NextResponse.json({ ok: true }, { headers: noStore });
}

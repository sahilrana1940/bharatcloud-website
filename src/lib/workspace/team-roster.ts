import type { SupabaseClient } from "@supabase/supabase-js";

import { listPersonalUsersForCompany } from "@/lib/company-admin/stats";

export type TeamRole = "owner" | "admin" | "member";

export type TeamRosterMember = {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  drive_sync_status: string;
  storage_used_gb: number;
  drive_limit_gb: number;
  is_backup_enabled: boolean;
};

type RosterContext = {
  companyId: string;
  domain: string;
  adminEmail: string;
  sessionEmail: string;
};

function text(value: unknown) {
  return String(value || "").trim();
}

function emailOf(row: Record<string, unknown>) {
  return text(row.email || row.user_email || row.owner_email).toLowerCase();
}

function storageGb(row: Record<string, unknown>) {
  const gb = Number(row.drive_used_gb ?? row.storage_used_gb ?? 0);
  if (gb > 0) return gb;
  const bytes = Number(row.storage_used ?? row.storage_used_bytes ?? 0);
  return bytes > 0 ? bytes / 1024 ** 3 : 0;
}

function roleOf(email: string, row: Record<string, unknown>, adminEmail: string): TeamRole {
  if (email && email === adminEmail) return "owner";
  const role = text(row.role || row.saas_role).toLowerCase();
  if (row.is_company_owner === true || role === "owner" || role === "company_owner") return "owner";
  if (role === "admin") return "admin";
  return "member";
}

function rank(role: TeamRole) {
  if (role === "owner") return 3;
  if (role === "admin") return 2;
  return 1;
}

async function readRows(
  supabase: SupabaseClient,
  table: string,
  apply: (query: ReturnType<SupabaseClient["from"]>) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  try {
    const { data, error } = await apply(supabase.from(table));
    if (error || !Array.isArray(data)) return [] as Record<string, unknown>[];
    return data as Record<string, unknown>[];
  } catch {
    return [] as Record<string, unknown>[];
  }
}

export async function loadTeamRoster(
  supabase: SupabaseClient,
  ctx: RosterContext,
): Promise<TeamRosterMember[]> {
  const adminEmail = ctx.adminEmail.trim().toLowerCase();
  const sessionEmail = ctx.sessionEmail.trim().toLowerCase();
  const domain = ctx.domain.trim().toLowerCase();
  const byEmail = new Map<string, TeamRosterMember>();

  const add = (row: Record<string, unknown>, fallbackRole?: TeamRole) => {
    const email = emailOf(row);
    if (!email.includes("@")) return;
    if (domain && !email.endsWith(`@${domain}`) && email !== adminEmail && email !== sessionEmail) {
      const explicit = text(row.company_id) === ctx.companyId || text(row.org_id);
      if (!explicit && emailOf(row) !== adminEmail) return;
    }
    const nextRole = fallbackRole || roleOf(email, row, adminEmail);
    const current = byEmail.get(email);
    const storage = storageGb(row);
    const driveStatus = text(row.drive_sync_status || row.google_connect_status) || current?.drive_sync_status || "idle";
    const member: TeamRosterMember = {
      id: text(row.id) || current?.id || email,
      email,
      name: text(row.display_name || row.full_name || row.name) || current?.name || email.split("@")[0],
      role: current && rank(current.role) >= rank(nextRole) ? current.role : nextRole,
      drive_sync_status: driveStatus,
      storage_used_gb: Math.max(current?.storage_used_gb || 0, storage),
      drive_limit_gb: Number(row.drive_limit_gb || current?.drive_limit_gb || 100) || 100,
      is_backup_enabled: row.is_backup_enabled !== false && current?.is_backup_enabled !== false,
    };
    byEmail.set(email, member);
  };

  add({ email: adminEmail, role: "owner", is_company_owner: true, display_name: adminEmail.split("@")[0] }, "owner");
  if (sessionEmail && sessionEmail !== adminEmail) {
    add({ email: sessionEmail, role: "admin", display_name: sessionEmail.split("@")[0] }, "admin");
  }

  const companyUsers = await readRows(supabase, "company_users", (query) =>
    query.select("*").eq("company_id", ctx.companyId),
  );
  companyUsers.forEach((row) => add(row));

  const personal = await listPersonalUsersForCompany(supabase, ctx.companyId, domain);
  personal.forEach((row) => add({ ...(row as Record<string, unknown>), company_id: ctx.companyId }));

  const teamByCompany = await readRows(supabase, "team_members", (query) =>
    query.select("*").eq("company_id", ctx.companyId),
  );
  const teamByDomain = domain
    ? await readRows(supabase, "team_members", (query) => query.select("*").eq("company_domain", domain))
    : [];
  [...teamByCompany, ...teamByDomain].forEach((row) => add({ ...row, company_id: ctx.companyId }));

  const orgLookups = [...new Set([adminEmail, sessionEmail].filter(Boolean))];
  const orgGroups = await Promise.all(
    orgLookups.map((email) =>
      readRows(supabase, "organizations", (query) => query.select("id, owner_email, name").ilike("owner_email", email)),
    ),
  );
  const orgs = orgGroups.flat().filter((row) => {
    const owner = text(row.owner_email).toLowerCase();
    return owner === adminEmail || owner === sessionEmail;
  });
  const orgIds = orgs.map((row) => text(row.id)).filter(Boolean);
  orgs.forEach((row) => add({ email: row.owner_email, role: "owner", display_name: row.name }, "owner"));

  if (orgIds.length) {
    const orgMembers = await readRows(supabase, "org_members", (query) =>
      query.select("*").in("org_id", orgIds),
    );
    const organizationMembers = await readRows(supabase, "organization_members", (query) =>
      query.select("*").in("org_id", orgIds),
    );
    [...orgMembers, ...organizationMembers].forEach((row) => add({ ...row, company_id: ctx.companyId }));
  }

  if (domain) {
    const users = await readRows(supabase, "users", (query) =>
      query.select("*").ilike("email", `%@${domain}`).limit(100),
    );
    users.forEach((row) => add(row));
  }

  return [...byEmail.values()].sort((a, b) => rank(b.role) - rank(a.role) || a.email.localeCompare(b.email));
}

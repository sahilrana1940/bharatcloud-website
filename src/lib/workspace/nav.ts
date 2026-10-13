import type { SaasRole } from "@/lib/workspace/session";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Who sees this link in the sidebar */
  for: "owner" | "employee" | "all";
};

/** Icons resolved in WorkspaceShell — keep href/label/for here only. */
export const WORKSPACE_NAV: WorkspaceNavItem[] = [
  { href: "/dashboard/employee", label: "Employee home", icon: "Cloud", for: "employee" },
  { href: "/dashboard/drive", label: "My Drive", icon: "HardDrive", for: "employee" },
  { href: "/dashboard/employee/upload", label: "Upload video", icon: "Upload", for: "employee" },
  { href: "/dashboard/employee/vault", label: "Search vault", icon: "Search", for: "employee" },
  { href: "/dashboard/employee/mail", label: "My mail archive", icon: "Mail", for: "employee" },
  { href: "/dashboard/owner", label: "Owner hub", icon: "LayoutDashboard", for: "owner" },
  { href: "/dashboard/company-admin", label: "Company admin", icon: "Building", for: "owner" },
  { href: "/dashboard/drive", label: "Drive", icon: "HardDrive", for: "owner" },
  { href: "/dashboard/vault", label: "My Vault", icon: "Shield", for: "owner" },
  { href: "/dashboard/emails", label: "Search company mail", icon: "Mail", for: "owner" },
  { href: "/dashboard/shared", label: "Shared", icon: "Share2", for: "owner" },
  { href: "/dashboard/recent", label: "Recent", icon: "Clock", for: "owner" },
  { href: "/dashboard/trash", label: "Trash", icon: "Trash2", for: "owner" },
  { href: "/dashboard/team", label: "Team & backup", icon: "User", for: "owner" },
  { href: "/dashboard/storage", label: "B3 Storage", icon: "B3Storage", for: "owner" },
  { href: "/dashboard/billing", label: "Billing", icon: "CreditCard", for: "owner" },
  { href: "/settings", label: "Settings", icon: "Settings", for: "all" },
];

export function isWorkspaceOwner(session: {
  role: string;
  saasRole?: SaasRole;
  isCompanyOwner?: boolean;
}): boolean {
  if (session.saasRole === "super_admin") return false;
  if (session.saasRole === "company_owner") return true;
  if (session.isCompanyOwner) return true;
  return session.role === "admin";
}

export function workspaceNavFor(session: {
  role: string;
  saasRole?: SaasRole;
  isCompanyOwner?: boolean;
}): WorkspaceNavItem[] {
  const owner = isWorkspaceOwner(session);
  const seen = new Set<string>();
  const out: WorkspaceNavItem[] = [];
  for (const item of WORKSPACE_NAV) {
    if (item.for === "all") {
      if (!seen.has(item.href)) {
        seen.add(item.href);
        out.push(item);
      }
      continue;
    }
    if (owner && item.for === "owner" && !seen.has(item.href)) {
      seen.add(item.href);
      out.push(item);
    }
    if (!owner && item.for === "employee" && !seen.has(item.href)) {
      seen.add(item.href);
      out.push(item);
    }
  }
  return out;
}

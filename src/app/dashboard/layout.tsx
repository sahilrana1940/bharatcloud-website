import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";
import { WorkspaceShell } from "@/components/dashboard/WorkspaceShell";
import { ThemeProvider } from "@/components/theme-provider";
import type { SaasRole, WorkspaceRole } from "@/lib/workspace/session";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWorkspaceSession();
  if (!session) {
    redirect("/login");
  }
  if (isSuperAdminEmail(session.email)) {
    redirect("/admin");
  }
  const roleInfo = await getUserRole(session.email);
  if (roleInfo.role === "super_admin") {
    redirect("/admin");
  }
  const isOwner =
    roleInfo.role === "company_owner" || roleInfo.is_company_owner;
  const shellRole: WorkspaceRole = isOwner ? "admin" : "member";
  const shellSaas: SaasRole = isOwner ? "company_owner" : "employee";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WorkspaceShell
        role={shellRole}
        saasRole={shellSaas}
        isCompanyOwner={isOwner}
        userEmail={session.email}
        companyId={session.companyId}
      >
        {children}
      </WorkspaceShell>
    </ThemeProvider>
  );
}

import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/auth";
import { WorkspaceShell } from "@/components/dashboard/WorkspaceShell";
import { ThemeProvider } from "@/components/theme-provider";
import type { SaasRole, WorkspaceRole } from "@/lib/workspace/session";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWorkspaceSession();
  if (!session) {
    redirect("/login");
  }
  const roleInfo = await getUserRole(session.email);
  const isOwner =
    roleInfo.role === "company_owner" ||
    roleInfo.role === "super_admin" ||
    roleInfo.is_company_owner;
  const shellRole: WorkspaceRole = isOwner ? "admin" : "member";
  const shellSaas: SaasRole = isOwner
    ? roleInfo.role === "super_admin"
      ? "super_admin"
      : "company_owner"
    : "employee";

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

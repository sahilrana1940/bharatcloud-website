import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/WorkspaceShell";
import { ThemeProvider } from "@/components/theme-provider";
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
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WorkspaceShell
        role={session.role}
        saasRole={session.saasRole}
        isCompanyOwner={session.isCompanyOwner}
        userEmail={session.email}
        companyId={session.companyId}
      >
        {children}
      </WorkspaceShell>
    </ThemeProvider>
  );
}

import { redirect } from "next/navigation";

import { WorkspaceShell } from "@/components/dashboard/WorkspaceShell";
import { ThemeProvider } from "@/components/theme-provider";
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
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WorkspaceShell role={session.role} userEmail={session.email}>
        {children}
      </WorkspaceShell>
    </ThemeProvider>
  );
}

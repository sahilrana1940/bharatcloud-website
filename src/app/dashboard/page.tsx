import { redirect } from "next/navigation";

import { CloudDashboard } from "@/components/dashboard/CloudDashboard";
import { ThemeProvider } from "@/components/theme-provider";
import { getB2BCompanyId } from "@/lib/b2b/session";

export default async function DashboardPage() {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    redirect("/login");
  }
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CloudDashboard />
    </ThemeProvider>
  );
}

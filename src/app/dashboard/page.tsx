import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SuperAdminTenantsDashboard } from "@/components/saas/SuperAdminTenantsDashboard";
import { getUserRole, defaultDashboardForRole } from "@/lib/auth";
import { isPlatformSuperAdminEmail } from "@/lib/roles/platform-roles";
import { getWorkspaceSession } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Dashboard · Bharat Cloud",
};

export default async function DashboardPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  if (isPlatformSuperAdminEmail(session.email)) {
    return <SuperAdminTenantsDashboard adminEmail={session.email} />;
  }

  const role = await getUserRole(session.email);
  if (role.role === "super_admin" && !isPlatformSuperAdminEmail(session.email)) {
    redirect("/dashboard/employee");
  }

  const dest = defaultDashboardForRole(role);
  if (dest !== "/dashboard") {
    redirect(dest);
  }

  redirect("/dashboard/employee");
}

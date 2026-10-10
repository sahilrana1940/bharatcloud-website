import { redirect } from "next/navigation";

import { OwnerDashboardClient } from "@/components/dashboard/OwnerDashboardClient";
import { getSessionRole } from "@/lib/auth";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function OwnerDashboardPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  const role = await getSessionRole();
  if (!role?.is_company_owner && role?.role !== "company_owner") {
    redirect("/dashboard/employee");
  }
  return <OwnerDashboardClient />;
}

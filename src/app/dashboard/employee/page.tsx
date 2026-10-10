import { redirect } from "next/navigation";

import { EmployeeDashboardClient } from "@/components/dashboard/EmployeeDashboardClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeDashboardPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return <EmployeeDashboardClient />;
}

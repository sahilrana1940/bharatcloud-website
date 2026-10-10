import { redirect } from "next/navigation";

import { defaultDashboardForRole, getSessionRole } from "@/lib/auth";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function DashboardIndex() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  const roleInfo = await getSessionRole();
  if (roleInfo) {
    redirect(defaultDashboardForRole(roleInfo));
  }
  redirect("/dashboard/employee");
}

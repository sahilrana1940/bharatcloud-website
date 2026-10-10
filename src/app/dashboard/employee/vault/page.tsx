import { redirect } from "next/navigation";

import { EmployeeVaultClient } from "@/components/dashboard/EmployeeVaultClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeVaultPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return <EmployeeVaultClient userEmail={session.email} />;
}

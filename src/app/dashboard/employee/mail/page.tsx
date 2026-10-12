import { redirect } from "next/navigation";

import { EmployeeMailArchiveClient } from "@/components/dashboard/EmployeeMailArchiveClient";
import { isEmailBackupEnabled } from "@/lib/feature-flags";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeMailPage() {
  if (!isEmailBackupEnabled()) {
    redirect("/dashboard/employee/vault");
  }
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return <EmployeeMailArchiveClient userEmail={session.email} />;
}

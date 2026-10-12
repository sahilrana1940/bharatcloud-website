import { redirect } from "next/navigation";

import { EmployeeMailArchiveClient } from "@/components/dashboard/EmployeeMailArchiveClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeMailPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return <EmployeeMailArchiveClient userEmail={session.email} />;
}

import { redirect } from "next/navigation";

import { B3StorageClient } from "@/components/dashboard/B3StorageClient";
import { getWorkspaceSession } from "@/lib/workspace/session";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export default async function B3StoragePage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    redirect("/dashboard/employee");
  }
  return <B3StorageClient />;
}

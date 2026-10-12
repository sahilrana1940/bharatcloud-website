import { redirect } from "next/navigation";

import { VaultEmailsClient } from "@/components/dashboard/VaultEmailsClient";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmailsPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  const owner = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });
  if (!owner) redirect("/dashboard/employee");
  return <VaultEmailsClient mode="emails" isAdmin={owner} />;
}

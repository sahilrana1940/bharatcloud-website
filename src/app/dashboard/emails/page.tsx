import { redirect } from "next/navigation";

import { VaultEmailsClient } from "@/components/dashboard/VaultEmailsClient";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { getWorkspaceSession } from "@/lib/workspace/session";

/** Owner / founder — search all staff Gmail backups in one company inbox. */
export default async function CompanyEmailsPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  const owner = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });
  if (!owner) redirect("/dashboard/employee/mail");

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <VaultEmailsClient mode="emails" isAdmin={true} />
    </div>
  );
}

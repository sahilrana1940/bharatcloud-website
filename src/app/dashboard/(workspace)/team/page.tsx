import { redirect } from "next/navigation";

import { TeamPageClient } from "@/components/dashboard/TeamPageClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function TeamPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  const canManageTeam =
    session.role === "admin" ||
    session.isCompanyOwner ||
    session.saasRole === "company_owner";

  if (!canManageTeam) redirect("/dashboard/employee");

  return (
    <TeamPageClient
      canManageTeam={canManageTeam}
      userEmail={session.email}
    />
  );
}

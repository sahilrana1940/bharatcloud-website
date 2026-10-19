import { Suspense } from "react";
import { redirect } from "next/navigation";

import { EmployeeMailArchiveClient } from "@/components/dashboard/EmployeeMailArchiveClient";
import { getUserRole } from "@/lib/auth";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeMailPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  const role = await getUserRole(session.email);
  const isAdmin =
    role.is_company_owner || role.role === "company_owner" || role.role === "super_admin";
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading mail archive…</p>}>
      <EmployeeMailArchiveClient
        userEmail={session.email}
        scope={isAdmin ? "admin" : "employee"}
        isSuperAdmin={role.role === "super_admin"}
      />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";

import { EmployeeMailArchiveClient } from "@/components/dashboard/EmployeeMailArchiveClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeMailPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading mail archive…</p>}>
      <EmployeeMailArchiveClient userEmail={session.email} />
    </Suspense>
  );
}

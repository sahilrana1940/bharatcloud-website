import { redirect } from "next/navigation";

import { EmployeeUploadClient } from "@/components/dashboard/EmployeeUploadClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeUploadPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return <EmployeeUploadClient />;
}

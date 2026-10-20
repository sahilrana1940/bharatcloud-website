import { redirect } from "next/navigation";

import { EmailBackupDriveClient } from "@/components/dashboard/EmailBackupDriveClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmailBackupPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  return <EmailBackupDriveClient userEmail={session.email} />;
}

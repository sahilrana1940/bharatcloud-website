import { DrivePageClient } from "@/components/dashboard/DrivePageClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function DrivePage() {
  const session = await getWorkspaceSession();
  return <DrivePageClient isAdmin={session?.role === "admin"} />;
}

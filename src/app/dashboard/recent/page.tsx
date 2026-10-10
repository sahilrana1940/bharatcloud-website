import { DriveShell } from "@/components/dashboard/DriveShell";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function RecentPage() {
  const session = await getWorkspaceSession();
  return (
    <DriveShell
      userEmail={session?.email ?? ""}
      listSource="recent"
      showUpload={false}
      title="Recent"
      subtitle="Latest backed up files"
    />
  );
}

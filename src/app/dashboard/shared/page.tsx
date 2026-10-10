import { DriveShell } from "@/components/dashboard/DriveShell";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function SharedPage() {
  const session = await getWorkspaceSession();
  return (
    <DriveShell
      userEmail={session?.email ?? ""}
      listSource="shared"
      showUpload={false}
      title="Shared with me"
      subtitle="Files shared across your workspace"
    />
  );
}

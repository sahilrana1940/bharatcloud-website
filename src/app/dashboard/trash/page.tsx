import { DriveShell } from "@/components/dashboard/DriveShell";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function TrashPage() {
  const session = await getWorkspaceSession();
  return (
    <DriveShell
      userEmail={session?.email ?? ""}
      listSource="trash"
      showUpload={false}
      title="Trash"
      subtitle="Restore or permanently remove later"
    />
  );
}

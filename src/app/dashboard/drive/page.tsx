import { DriveShell } from "@/components/dashboard/DriveShell";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function DrivePage() {
  const session = await getWorkspaceSession();
  return (
    <DriveShell userEmail={session?.email ?? ""} listSource="drive" showUpload />
  );
}

import { redirect } from "next/navigation";

import { DriveShell } from "@/components/dashboard/DriveShell";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmployeeUploadPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");
  return (
    <DriveShell
      userEmail={session.email}
      listSource="bharatcloud"
      showUpload
      title="Upload CCTV / Video"
      subtitle="Files are stored under your email folder"
    />
  );
}

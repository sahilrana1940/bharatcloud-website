import { VaultEmailsClient } from "@/components/dashboard/VaultEmailsClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function EmailsPage() {
  const session = await getWorkspaceSession();
  return (
    <VaultEmailsClient
      mode="emails"
      isAdmin={session?.role === "admin"}
    />
  );
}

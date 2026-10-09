import { VaultEmailsClient } from "@/components/dashboard/VaultEmailsClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function MyVaultPage() {
  const session = await getWorkspaceSession();
  return (
    <VaultEmailsClient
      mode="vault"
      isAdmin={session?.role === "admin"}
    />
  );
}

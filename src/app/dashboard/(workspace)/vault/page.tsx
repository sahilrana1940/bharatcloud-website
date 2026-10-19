import { VaultPageClient } from "@/components/dashboard/VaultPageClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function VaultPage() {
  const session = await getWorkspaceSession();
  return <VaultPageClient userEmail={session?.email ?? ""} />;
}

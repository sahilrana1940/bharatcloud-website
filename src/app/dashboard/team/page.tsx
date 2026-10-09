import { redirect } from "next/navigation";

import { TeamPageClient } from "@/components/dashboard/TeamPageClient";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function TeamPage() {
  const session = await getWorkspaceSession();
  if (session?.role !== "admin") redirect("/dashboard/drive");
  return <TeamPageClient />;
}

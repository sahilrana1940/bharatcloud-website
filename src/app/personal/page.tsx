import { redirect } from "next/navigation";

import { PersonalGalleryClient } from "@/components/personal/PersonalGalleryClient";
import { getUploadContext } from "@/lib/personal/access";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function PersonalPage() {
  const session = await getWorkspaceSession();
  if (!session) redirect("/login");

  const ctx = await getUploadContext();
  if (ctx?.companyDomain && !ctx.isB2C && session.companyId !== "demo-company-workspace") {
    redirect("/dashboard/employee");
  }

  return <PersonalGalleryClient />;
}

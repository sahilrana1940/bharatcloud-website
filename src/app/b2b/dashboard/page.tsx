import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/b2b/DashboardClient";
import { getB2BCompanyId } from "@/lib/b2b/session";

export default async function B2BDashboardPage() {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    redirect("/login");
  }
  return <DashboardClient />;
}

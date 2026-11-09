import { redirect } from "next/navigation";

import { loadSession } from "@/lib/product/store";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const { user, error } = await loadSession();
  if (error) return <main className="mx-auto max-w-lg px-5 py-16 text-sm">{error}</main>;
  if (!user) redirect("/enter");
  if (user.role === "super_admin") redirect("/hub/super");
  if (user.role === "partner") redirect("/hub/partner");
  if (user.role === "company_admin") redirect("/hub/company");
  redirect("/hub/employee");
}

import { redirect } from "next/navigation";

import { CompanyHome } from "@/components/product/CompanyHome";
import { loadSession } from "@/lib/product/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, error } = await loadSession();
  if (error) return <main className="mx-auto max-w-lg px-5 py-16 text-sm">{error}</main>;
  if (!user) redirect("/enter");
  if (user.role !== "employee") redirect("/hub");
  return <CompanyHome mode="employee" />;
}

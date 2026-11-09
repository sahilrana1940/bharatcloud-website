import { redirect } from "next/navigation";

import { BackupApp } from "@/components/product/BackupApp";
import { loadSession } from "@/lib/product/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, error } = await loadSession();
  if (error) return <main className="mx-auto max-w-lg px-5 py-16 text-sm">{error}</main>;
  if (!user) redirect("/enter");
  if (user.role !== "company_admin" && user.role !== "employee") redirect("/hub");
  return <BackupApp />;
}
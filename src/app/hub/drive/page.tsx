import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DriveApp } from "@/components/product/DriveApp";
import { loadSession } from "@/lib/product/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, error } = await loadSession();
  if (error) return <main className="mx-auto max-w-lg px-5 py-16 text-sm">{error}</main>;
  if (!user) redirect("/enter");
  if (user.role !== "company_admin" && user.role !== "employee") redirect("/hub");
  return (
    <Suspense fallback={<main className="p-6 text-sm">Drive khul raha hai...</main>}>
      <DriveApp />
    </Suspense>
  );
}

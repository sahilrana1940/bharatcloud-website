import { NextResponse } from "next/server";

import { getWorkspaceSession } from "@/lib/workspace/session";

export async function requireWorkspace(
  adminOnly = false,
): Promise<
  | {
      session: {
        companyId: string;
        email: string;
        role: "admin" | "member";
        saasRole?: "super_admin" | "company_owner" | "employee";
        isCompanyOwner?: boolean;
      };
    }
  | NextResponse
> {
  const session = await getWorkspaceSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (adminOnly && session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return { session };
}

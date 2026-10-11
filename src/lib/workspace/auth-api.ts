import { NextResponse } from "next/server";

import { requireTenant, type WorkspaceSessionSlice } from "@/lib/tenant";

export async function requireWorkspace(
  adminOnly = false,
): Promise<{ session: WorkspaceSessionSlice; tenant?: import("@/lib/tenant").TenantContext } | NextResponse> {
  const result = await requireTenant(adminOnly);
  if (result instanceof NextResponse) return result;
  return { session: result.session, tenant: result.tenant };
}

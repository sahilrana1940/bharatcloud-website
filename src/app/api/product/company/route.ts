import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { createEmployee, submitPayment, workspaceOverview } from "@/lib/product/store";

export async function GET() {
  try {
    return NextResponse.json(await workspaceOverview());
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "pay") {
      return NextResponse.json(
        await submitPayment({
          kind: "company_plan",
          upiRef: String(body.upiRef || ""),
          cycle: body.cycle === "monthly" ? "monthly" : "yearly",
        }),
      );
    }
    return NextResponse.json(await createEmployee(body));
  } catch (error) {
    return productError(error);
  }
}

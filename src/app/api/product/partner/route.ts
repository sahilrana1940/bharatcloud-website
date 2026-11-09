import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { createCompany, partnerOverview, submitPayment, updateCompanyOffer } from "@/lib/product/store";

export async function GET() {
  try {
    return NextResponse.json(await partnerOverview());
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "pay") {
      return NextResponse.json(await submitPayment({ kind: "partner_plan", upiRef: String(body.upiRef || "") }));
    }
    if (body.action === "price") {
      return NextResponse.json(await updateCompanyOffer(body));
    }
    return NextResponse.json(await createCompany(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request fail ho gayi.";
    console.error("[partner] create/update failed:", message);
    return productError(error);
  }
}

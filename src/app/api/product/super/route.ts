import { NextResponse } from "next/server";

import { productError } from "@/lib/product/http";
import { confirmPayment, markCommissionPaid, reviewPartner, superOverview } from "@/lib/product/store";

export async function GET() {
  try {
    return NextResponse.json(await superOverview());
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "review") {
      return NextResponse.json(await reviewPartner(String(body.partnerId), body.decision === "reject" ? "reject" : "approve"));
    }
    if (body.action === "confirm-payment") {
      return NextResponse.json(await confirmPayment(String(body.paymentId)));
    }
    if (body.action === "pay-commission") {
      return NextResponse.json(await markCommissionPaid(String(body.commissionId)));
    }
    return NextResponse.json({ error: "Action samajh nahi aayi." }, { status: 400 });
  } catch (error) {
    return productError(error);
  }
}

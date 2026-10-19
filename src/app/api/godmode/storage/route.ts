import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    tiers: [{ name: "Tier 1 Mumbai E2E", used: "90GB", limit: "300GB" }],
  });
}

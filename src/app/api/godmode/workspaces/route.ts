import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    workspaces: [
      {
        id: 1,
        name: "Acme Pvt Ltd",
        email: "you@company.com",
        plan: "20 IDs Rs12999",
        status: "Active",
        storage: "300GB",
      },
      {
        id: 2,
        name: "North Mill",
        email: "ops@northmill.in",
        plan: "5 IDs Rs5999",
        status: "Active",
        storage: "100GB",
      },
      {
        id: 3,
        name: "West Dock",
        email: "admin@westdock.in",
        plan: "50 IDs Rs14999",
        status: "Pending",
        storage: "1TB",
      },
    ],
  });
}

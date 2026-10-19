import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    approvals: [
      { user: "test@gmail.com", type: "Gmail", status: "Pending", date: "Today" },
      { user: "drive.one@company.com", type: "Drive", status: "Pending", date: "Today" },
      { user: "drive.two@company.com", type: "Drive", status: "Pending", date: "Today" },
    ],
  });
}

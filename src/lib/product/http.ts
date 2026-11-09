import { NextResponse } from "next/server";

export function productError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request fail ho gayi.";
  const status = /Permission|Login/i.test(message) ? 403 : 400;
  const plan = error && typeof error === "object" && "plan" in error ? (error as { plan?: unknown }).plan : undefined;
  return NextResponse.json({ error: message, plan }, { status });
}

import { handlePasswordLogin } from "@/lib/auth/password-login";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(req: Request) {
  return handlePasswordLogin(req);
}

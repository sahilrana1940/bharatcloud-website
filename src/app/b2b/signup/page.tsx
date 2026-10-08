import { redirect } from "next/navigation";

export default function B2BSignupRedirect() {
  redirect("/login?mode=register");
}

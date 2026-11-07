import { redirect } from "next/navigation";

export default function HighCommandRedirect() {
  redirect("/super-admin/members");
}

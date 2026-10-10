import { redirect } from "next/navigation";

export default function MyVaultRedirect() {
  redirect("/dashboard/vault");
}

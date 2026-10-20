import { CommandCenter } from "@/components/super-admin/CommandCenter";

export const dynamic = "force-dynamic";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <CommandCenter>{children}</CommandCenter>;
}

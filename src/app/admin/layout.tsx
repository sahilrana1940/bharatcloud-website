import { AdminProShell } from "@/components/layout/AdminProShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProShell>{children}</AdminProShell>;
}

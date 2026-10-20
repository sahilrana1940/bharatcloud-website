import { RoleDashboardGate } from "@/components/dashboard/RoleDashboardGate";
import CompanyAdminDashboardPage from "../company-admin/page";

export default function AdminDashboardPage() {
  return (
    <>
      <RoleDashboardGate expect="admin" />
      <CompanyAdminDashboardPage />
    </>
  );
}

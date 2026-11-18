import { redirect } from "next/navigation";
import UserRoleManager from "@/app/components/admin/UserRoleManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function SuperadminUsersPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/pengguna");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell
      role="superadmin"
      breadcrumb="Manajemen pengguna"
      title="Manajemen pengguna"
    >
      <UserRoleManager />
    </DashboardShell>
  );
}

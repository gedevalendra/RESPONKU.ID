import { redirect } from "next/navigation";
import EditorialOverview from "@/app/components/dashboard/EditorialOverview";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function SuperadminDashboardPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell
      role="superadmin"
      breadcrumb="Dashboard"
      title="Dashboard superadmin"
      description="Pantau penerbitan dan antrean artikel ResponKu."
    >
      <EditorialOverview role="superadmin" />
    </DashboardShell>
  );
}

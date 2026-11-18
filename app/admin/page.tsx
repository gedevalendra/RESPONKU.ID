import { redirect } from "next/navigation";
import EditorialOverview from "@/app/components/dashboard/EditorialOverview";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  if (actor.role === "superadmin") redirect("/superadmin");
  return (
    <DashboardShell
      role="admin"
      breadcrumb="Dashboard"
      title="Dashboard admin"
    >
      <EditorialOverview role="admin" />
    </DashboardShell>
  );
}

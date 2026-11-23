import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import WebsiteStatusManager from "@/app/components/admin/WebsiteStatusManager";
import { getActor, isSuperAdmin } from "@/lib/authz";

export default async function Page() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/status-website");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell role="superadmin" breadcrumb="Status website" title="Status website">
      <WebsiteStatusManager />
    </DashboardShell>
  );
}

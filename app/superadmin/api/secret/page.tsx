import { redirect } from "next/navigation";
import ApiSecretManager from "@/app/components/admin/ApiSecretManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function ApiSecretPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/api/secret");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell role="superadmin" breadcrumb="Secret ID API" title="Secret ID API">
      <ApiSecretManager />
    </DashboardShell>
  );
}

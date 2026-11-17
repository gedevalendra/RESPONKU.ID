import { redirect } from "next/navigation";
import ArticleManager from "@/app/components/admin/ArticleManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function SuperadminArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/artikel");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return (
    <DashboardShell
      role="superadmin"
      breadcrumb="Approval artikel"
      title="Approval artikel"
      description="Tinjau artikel yang masuk dan tentukan status publikasinya."
    >
      <ArticleManager superadminView />
    </DashboardShell>
  );
}

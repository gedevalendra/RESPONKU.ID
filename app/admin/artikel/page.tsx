import { redirect } from "next/navigation";
import ArticleManager from "@/app/components/admin/ArticleManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function AdminArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/artikel");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  if (actor.role === "superadmin") redirect("/superadmin/artikel");
  return (
    <DashboardShell
      role="admin"
      breadcrumb="Artikel & approval"
      title="Artikel & approval"
    >
      <ArticleManager />
    </DashboardShell>
  );
}

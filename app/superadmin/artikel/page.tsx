import { redirect } from "next/navigation";
import ArticleManager from "@/app/components/admin/ArticleManager";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function SuperadminArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/artikel");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Superadmin / Editorial</p><h1 className="mt-2 font-display text-display-lg">Approval artikel</h1><p className="mt-3 max-w-2xl text-mute">Tinjau artikel yang masuk dan tentukan status publikasinya.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="superadmin" /><main className="min-w-0"><ArticleManager superadminView /></main></div></div>;
}

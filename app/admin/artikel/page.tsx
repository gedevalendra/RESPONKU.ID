import { redirect } from "next/navigation";
import ArticleManager from "@/app/components/admin/ArticleManager";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function AdminArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/artikel");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  if (actor.role === "superadmin") redirect("/superadmin/artikel");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Panel admin / Artikel</p><h1 className="mt-2 font-display text-display-lg">Artikel & approval</h1><p className="mt-3 max-w-2xl text-mute">Kelola naskah redaksi dan periksa kiriman pengguna.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="admin" /><main className="min-w-0"><ArticleManager /></main></div></div>;
}

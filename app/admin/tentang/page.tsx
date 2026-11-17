import { redirect } from "next/navigation";
import AboutManager from "@/app/components/admin/AboutManager";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function AdminAboutPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/tentang");
  if (!isStaff(actor.role) || actor.role === "superadmin") redirect("/admin");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Panel admin / CMS</p><h1 className="mt-2 font-display text-display-lg">Halaman Tentang</h1><p className="mt-3 max-w-2xl text-mute">Kelola seluruh isi halaman Tentang ResponKu dan urutan bagiannya.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="admin" /><main className="min-w-0"><AboutManager /></main></div></div>;
}

import { redirect } from "next/navigation";
import ArticleManager from "@/app/components/admin/ArticleManager";
import AboutManager from "@/app/components/admin/AboutManager";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  if (actor.role === "superadmin") redirect("/superadmin");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Panel admin</p><h1 className="mt-2 font-display text-display-lg">Ruang redaksi</h1><p className="mt-3 max-w-2xl text-mute">Kelola artikel, periksa kiriman user, terbitkan konten, dan atur halaman informasi ResponKu.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="admin" /><main className="min-w-0"><section id="ringkasan" className="scroll-mt-28"><div className="mb-5 bg-blue-50 p-5"><p className="eyebrow text-blue-600">Ringkasan kerja</p><p className="mt-2 font-mono text-sm text-gray-700">Gunakan menu di kiri untuk berpindah antara pengelolaan artikel dan CMS halaman Tentang.</p></div></section><section id="artikel" className="scroll-mt-28"><ArticleManager /></section><section id="tentang" className="scroll-mt-28"><AboutManager /></section></main></div></div>;
}

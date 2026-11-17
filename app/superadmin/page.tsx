import { redirect } from "next/navigation";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function SuperadminDashboardPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Kontrol tertinggi</p><h1 className="mt-2 font-display text-display-lg">Ringkasan superadmin</h1><p className="mt-3 max-w-2xl text-mute">Pusat administrasi untuk approval editorial dan pengelolaan akses pengguna.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="superadmin" /><main className="grid min-w-0 gap-5 sm:grid-cols-2"><div className="bg-blue-50 p-6"><p className="eyebrow text-blue-600">Approval editorial</p><h2 className="mt-3 font-mono text-xl font-normal text-gray-800">Tinjau artikel</h2><p className="mt-2 text-sm text-gray-600">Putuskan artikel mana yang dapat diterbitkan atau dikembalikan ke penulis.</p><a href="/superadmin/artikel" className="mt-5 inline-block font-mono text-xs uppercase tracking-widest2 text-blue-600 hover:text-blue-800">Buka halaman →</a></div><div className="bg-white p-6 shadow-sm"><p className="eyebrow">Administrasi</p><h2 className="mt-3 font-mono text-xl font-normal text-gray-800">Manajemen pengguna</h2><p className="mt-2 text-sm text-gray-600">Atur role reader, author, admin, dan superadmin.</p><a href="/superadmin/pengguna" className="mt-5 inline-block font-mono text-xs uppercase tracking-widest2 text-blue-600 hover:text-blue-800">Buka halaman →</a></div></main></div></div>;
}

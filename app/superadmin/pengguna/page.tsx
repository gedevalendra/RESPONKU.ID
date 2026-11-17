import { redirect } from "next/navigation";
import UserRoleManager from "@/app/components/admin/UserRoleManager";
import DashboardSidebar from "@/app/components/dashboard/DashboardSidebar";
import { getActor, isSuperAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function SuperadminUsersPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/superadmin/pengguna");
  if (!isSuperAdmin(actor.role)) redirect("/admin");
  return <div className="wrap py-8 sm:py-12"><div className="mb-10"><p className="eyebrow">Superadmin / Administrasi</p><h1 className="mt-2 font-display text-display-lg">Manajemen pengguna</h1><p className="mt-3 max-w-2xl text-mute">Atur role dan hak akses akun yang terdaftar.</p></div><div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12"><DashboardSidebar role="superadmin" /><main className="min-w-0"><UserRoleManager /></main></div></div>;
}

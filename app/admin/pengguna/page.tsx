import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import UserRoleManager from "@/app/components/admin/UserRoleManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/pengguna");
  if (!isStaff(actor.role)) redirect("/akun");
  return <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} title="Daftar pengguna" breadcrumb="Pengguna"><UserRoleManager /></DashboardShell>;
}

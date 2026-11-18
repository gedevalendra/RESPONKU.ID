import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import Organizations from "@/app/components/user/Organizations";
export default async function Page() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect("/masuk");
  return <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} title="Organisasi dan verifikasi" breadcrumb="Organisasi"><Organizations admin /></DashboardShell>;
}

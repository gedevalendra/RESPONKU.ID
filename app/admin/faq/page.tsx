import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import FaqQuestions from "@/app/components/user/FaqQuestions";
export default async function Page() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) redirect("/masuk");
  return <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} breadcrumb="FAQ" title="Pertanyaan pengguna"><FaqQuestions admin /></DashboardShell>;
}

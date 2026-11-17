import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import WelcomePopup from "@/app/components/layout/WelcomePopup";
export default async function Page() {
  const actor = await getActor(); if (!actor || !isStaff(actor.role)) redirect("/masuk");
  return <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} title="Popup informasi" breadcrumb="Popup" description="Atur informasi yang tampil sekali untuk setiap pembaruan popup."><WelcomePopup admin /></DashboardShell>;
}

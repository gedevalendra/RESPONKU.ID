import { redirect } from "next/navigation";
import AboutManager from "@/app/components/admin/AboutManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";
export default async function AdminAboutPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/tentang");
  if (!isStaff(actor.role) || actor.role === "superadmin") redirect("/admin");
  return (
    <DashboardShell
      role="admin"
      breadcrumb="Halaman Tentang"
      title="Halaman Tentang"
      description="Kelola sejarah, prinsip, ketentuan kontribusi, dan urutan bagian halaman Tentang ResponKu."
    >
      <AboutManager />
    </DashboardShell>
  );
}

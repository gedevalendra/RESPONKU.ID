import { redirect } from "next/navigation";
import NotificationComposer from "@/app/components/admin/NotificationComposer";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/notifikasi");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  return (
    <DashboardShell
      role={actor.role === "superadmin" ? "superadmin" : "admin"}
      breadcrumb="Kirim notifikasi"
      title="Kirim notifikasi"
      description="Sampaikan informasi penting kepada pengguna dan kirimkan ke perangkat yang sudah mengaktifkan web push."
    >
      <NotificationComposer />
    </DashboardShell>
  );
}

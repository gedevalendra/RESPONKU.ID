import { redirect } from "next/navigation";
import TickerManager from "@/app/components/admin/TickerManager";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import { getActor, isStaff } from "@/lib/authz";
import { getManualTickerHeadlines } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTickerPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/ticker");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  return (
    <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} breadcrumb="Ticker berita" title="Ticker berita">
      <TickerManager initial={await getManualTickerHeadlines()} />
    </DashboardShell>
  );
}

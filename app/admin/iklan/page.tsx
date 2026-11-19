import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import HomepageAdEditor from "@/app/components/admin/HomepageAdEditor";
import { getActor, isStaff } from "@/lib/authz";
import { getHomepageAd } from "@/lib/homepage-ad";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/iklan");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");

  const [hot, gallery, sidebar] = await Promise.all([getHomepageAd("hot"), getHomepageAd("gallery"), getHomepageAd("sidebar")]);

  return (
    <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} breadcrumb="Iklan" title="Iklan">
      <div className="space-y-6">
        <HomepageAdEditor initial={hot} slot="hot" />
        <HomepageAdEditor initial={gallery} slot="gallery" />
        <HomepageAdEditor initial={sidebar} slot="sidebar" />
      </div>
    </DashboardShell>
  );
}

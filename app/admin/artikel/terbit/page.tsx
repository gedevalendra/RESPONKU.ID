import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import PublishedArticleManager from "@/app/components/admin/PublishedArticleManager";
import { getPinnedArticleIds } from "@/lib/homepage-pin";
import { getActor, isStaff } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublishedArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/artikel/terbit");
  if (!isStaff(actor.role)) redirect("/?error=forbidden");
  const [articles, pinnedIds] = await Promise.all([listArticlesFromDatabase({ status: "published" }), getPinnedArticleIds()]);

  return (
    <DashboardShell role={actor.role === "superadmin" ? "superadmin" : "admin"} breadcrumb="Artikel terbit" title="Artikel terbit"
    >
      <PublishedArticleManager pinnedIds={pinnedIds} canDelete={actor.role === "admin"} articles={articles.map(({ id, slug, title, author, views, promoted }) => ({
        id, slug, title, author, views, promoted,
      }))} />
    </DashboardShell>
  );
}

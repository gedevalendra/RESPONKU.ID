import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/DashboardShell";
import PublishedArticleManager from "@/app/components/admin/PublishedArticleManager";
import { getActor } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublishedArticlesPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/admin/artikel/terbit");
  if (actor.role !== "admin") redirect("/?error=forbidden");
  const articles = await listArticlesFromDatabase({ status: "published" });

  return (
    <DashboardShell role="admin" breadcrumb="Artikel terbit" title="Artikel terbit"
      description="Kelola artikel yang tampil di situs dan prioritaskan artikel di daftar Terpopuler.">
      <PublishedArticleManager articles={articles.map(({ id, slug, title, author, views, promoted }) => ({
        id, slug, title, author, views, promoted,
      }))} />
    </DashboardShell>
  );
}

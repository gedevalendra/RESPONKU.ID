import { compareArticlePopularity, formatDate, getPublishedArticles } from "@/lib/data";
import { getHomepageAd } from "@/lib/homepage-ad";
import HomepageAdBanner from "@/app/components/landing/HomepageAdBanner";
import TrendingList from "../../components/landing/TrendingList";
import ArticleRankingList from "@/app/components/landing/ArticleRankingList";

export default async function Sidebar({ compactAd = false, currentArticleSlug }: { compactAd?: boolean; currentArticleSlug?: string }) {
  const [articles, sidebarAd] = await Promise.all([getPublishedArticles(), getHomepageAd("sidebar").catch(() => null)]);
  const trending = [...articles].sort(compareArticlePopularity).slice(0, 5);
  const latest = compactAd ? articles.filter((article) => article.slug !== currentArticleSlug).slice(0, 5) : [];

  return (
    <aside className="flex flex-col gap-10 lg:h-full">
      <form action="/cari" role="search" className="hidden lg:block">
        <label htmlFor="sidebar-article-search" className="sr-only">Cari artikel</label>
        <div className="flex gap-2">
          <input id="sidebar-article-search" name="q" type="search" placeholder="Judul, topik, penulis…" className="h-11 min-w-0 flex-1 px-3 text-sm" />
          <button type="submit" aria-label="Cari artikel" className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-ink/90">
            <i className="bx bx-search text-xl" aria-hidden="true" />
          </button>
        </div>
      </form>
      <TrendingList items={trending} />
      {sidebarAd?.enabled && <HomepageAdBanner ad={sidebarAd} variant="sidebar" fillColumnHeight={!compactAd} sidebarCompact={compactAd} />}
      {compactAd && <ArticleRankingList
        title="Artikel terbaru"
        period="Baru terbit"
        items={latest.map((article) => ({ article, caption: formatDate(article.publishedAt || article.date) }))}
        emptyMessage="Belum ada artikel terbaru."
      />}
    </aside>
  );
}

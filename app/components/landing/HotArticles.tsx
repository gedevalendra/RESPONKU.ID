import ArticleRankingList from "./ArticleRankingList";
import HomepageAdBanner from "./HomepageAdBanner";
import type { HomepageAd } from "@/lib/homepage-ad";
import Link from "next/link";
import { formatDate } from "@/lib/content";
import type { Article } from "@/lib/types";

type RankedArticle = { article: Article; recentViews: number | null };

function StoryCard({ article, lead = false }: { article: Article; lead?: boolean }) {
  return (
    <Link href={`/artikel/${encodeURIComponent(article.slug)}`}
      className={`group relative isolate flex min-w-0 items-end overflow-hidden rounded-md bg-ink text-white focus-visible:outline-2 focus-visible:outline-offset-2 ${lead ? "aspect-square self-start p-5" : "aspect-[3/2] p-2 sm:p-3"}`}>
      {article.thumbnailUrl && <img src={article.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />}
      <span className="absolute inset-0 -z-10 bg-linear-to-t from-gray-900 via-gray-900/65 to-gray-900/10" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className={`wrap-break-word font-display leading-snug group-hover:underline ${lead ? "line-clamp-4 text-2xl" : "line-clamp-2 text-sm sm:text-base"}`}>{article.title}</h3>
        <p className={`${lead ? "mt-2" : "mt-1"} text-xs text-gray-200`}>{formatDate(article.publishedAt ?? article.date)}</p>
      </div>
    </Link>
  );
}

export default function HotArticles({ stories, ad }: { stories: RankedArticle[]; ad: HomepageAd | null }) {
  const [lead, ...supporting] = stories;
  if (!lead) return null;
  const dailyRanking = stories.filter((story): story is { article: Article; recentViews: number } =>
    story.recentViews !== null && story.recentViews > 0,
  );
  const alignAd = Boolean(ad && supporting.length >= 3);
  const lastRowSize = supporting.length % 2 || 2;
  const upperStories = alignAd ? supporting.slice(0, -lastRowSize) : supporting;
  const bottomStories = alignAd ? supporting.slice(-lastRowSize) : [];


  return (
    <section className="border-t border-rule" aria-labelledby="hot-articles-title">
      <div className="wrap grid gap-8 py-8 sm:py-10 xl:grid-cols-12 xl:gap-10">
        <div className="min-w-0 xl:col-span-8">
          <h2 id="hot-articles-title" className="mb-4 border-l-2 border-blue-500 pl-3 font-display text-2xl">Berita Hangat</h2>
          <div className={`grid gap-3 ${supporting.length ? "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "max-w-sm"}`}>
            <div className={alignAd ? "grid min-w-0 gap-3 md:contents" : "grid min-w-0 content-start gap-3"}>
              <StoryCard article={lead.article} lead />
              {ad && (
                <div className={alignAd ? "relative min-w-0 md:col-start-1 md:row-start-2" : "min-w-0"}>
                  <HomepageAdBanner ad={ad} fitRow={alignAd} />
                </div>
              )}
            </div>
            {upperStories.length > 0 && (
              <div className={`grid min-w-0 auto-rows-min grid-cols-2 gap-3 ${alignAd ? "md:col-start-2 md:row-start-1" : ""}`}>
                {upperStories.map(({ article }) => <StoryCard key={article.id} article={article} />)}
              </div>
            )}
            {bottomStories.length > 0 && (
              <div className="grid min-w-0 grid-cols-2 gap-3 md:col-start-2 md:row-start-2">
                {bottomStories.map(({ article }) => <StoryCard key={article.id} article={article} />)}
              </div>
            )}
          </div>
        </div>
        <aside className="min-w-0 xl:col-span-4">
          <ArticleRankingList
            title="Peringkat 24 Jam"
            period="24 jam terakhir"
            items={dailyRanking.map(({ article, recentViews }) => ({
              article,
              caption: `${recentViews.toLocaleString("id-ID")} tayangan`,
            }))}
            emptyMessage={lead.recentViews === null ? "Peringkat 24 jam belum bisa dimuat." : "Belum ada tayangan dalam 24 jam terakhir."}
          />
        </aside>
      </div>
    </section>
  );
}

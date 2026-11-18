import { getHomepageAd } from "@/lib/homepage-ad";
import HomepageAdBanner from "./components/landing/HomepageAdBanner";
import HotArticles from "./components/landing/HotArticles";
import { countRecentArticleViews } from "@/lib/db";
import HeroSection from "./components/landing/HeroSection";
import Sidebar from "./components/layout/Sidebar";
import ArticleCard from "./components/landing/ArticleCard";
import ArticleGallery from "./components/landing/ArticleGallery";
import Link from "next/link";
import { getPinnedArticleId } from "@/lib/homepage-pin";
import { homepageDescription, homepageTitle, publicPageMetadata, siteOrganization, siteOrigin } from "@/lib/seo";
import { getPublishedArticles } from "@/lib/data";

export const metadata = publicPageMetadata("/", homepageTitle, homepageDescription);

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteOrigin}/#website`,
      name: siteOrganization.name,
      alternateName: "ResponKu.id",
      url: siteOrganization.url,
      publisher: { "@id": siteOrganization["@id"] },
    },
    siteOrganization,
  ],
};

export default async function HomePage() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [published, pinnedId, recentViews, homepageAd, galleryAd] = await Promise.all([
    getPublishedArticles(),
    getPinnedArticleId(),
    countRecentArticleViews(since).catch(() => null),
    getHomepageAd("hot").catch(() => null),
    getHomepageAd("gallery").catch(() => null),
  ]);
  const hotStories = published.map((article) => ({ article, recentViews: recentViews ? recentViews.get(article.slug) ?? 0 : null }))
    .sort((a, b) => (b.recentViews ?? 0) - (a.recentViews ?? 0) || b.article.views - a.article.views)
    .slice(0, 7);
  const pinned = published.find((article) => article.id === pinnedId);
  const featured = published.filter((article) => article.featured);
  const heroStories = pinned ? [pinned] : featured.length ? featured : published.slice(0, 4);
  const latest = published.slice(0, 1);
  const otherArticles = published.slice(latest.length, latest.length + 6);
  const gallery = otherArticles.length < 3 ? [...otherArticles, ...latest] : otherArticles;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <HeroSection stories={heroStories} />

      <div className="wrap grid grid-cols-1 gap-12 border-t border-rule py-10 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-8">
        <section id="terbaru" aria-labelledby="latest-title" className="scroll-mt-40">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
            <h2 id="latest-title" className="font-display text-2xl">Terbaru</h2>
            <Link href="/artikel" className="inline-flex items-center gap-1 text-sm font-medium text-mute hover:text-ink">
              Semua artikel <i className="bx bx-right-arrow-alt text-lg" aria-hidden="true" />
            </Link>
          </div>
          {latest.length ? (
            <div className="divide-y divide-rule">
              {latest.map((article) => (
                <ArticleCard key={article.id} article={article} variant="row" />
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-mute">Belum ada artikel terbit.</p>}
        </section>
        {gallery.length > 0 && (
          <section aria-labelledby="explore-title" className="mt-10 border-t border-rule pt-6">
            {/* <h2 id="explore-title" className="font-display text-2xl">Jelajahi Artikel</h2> */}
            <ArticleGallery>
              {gallery.map((article) => (
                <ArticleCard key={article.id} article={article} variant="gallery" />
              ))}
            </ArticleGallery>
            {galleryAd?.enabled && (
              <div className="mt-5"><HomepageAdBanner ad={galleryAd} compact /></div>
            )}
          </section>
        )}
        </div>
        <div className="lg:col-span-4">
          <Sidebar />
        </div>
      </div>
      <HotArticles stories={hotStories} ad={homepageAd?.enabled ? homepageAd : null} />
      <section className="border-t border-rule">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-7">
          <div>
            <h2 className="font-display text-xl">Tulis artikel di ResponKu</h2>
            <p className="mt-1 text-sm text-mute">Kirim tulisanmu secara gratis untuk ditinjau redaksi.</p>
          </div>
          <Link href="/buat-artikel-gratis" className="text-sm font-medium text-blue-700 hover:underline">Panduan menulis artikel →</Link>
        </div>
      </section>
    </>
  );
}

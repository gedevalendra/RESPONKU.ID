import HeroSection from "./components/landing/HeroSection";
import SectionGrid from "./components/landing/SectionGrid";
import Sidebar from "./components/layout/Sidebar";
import ArticleCard from "./components/landing/ArticleCard";
import ArticleGallery from "./components/landing/ArticleGallery";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/data";

export default async function HomePage() {
  const published = await getPublishedArticles();
  const featured = published.filter((article) => article.featured);
  const heroStories = featured.length ? featured : published.slice(0, 4);
  const latest = published.slice(0, 1);
  const gallery = published.slice(latest.length, latest.length + 6);
  const technology = published.filter((article) => article.category === "Teknologi").slice(0, 2);
  const sports = published.filter((article) => article.category === "Olahraga").slice(0, 4);
  const culture = published.filter((article) => article.category === "Budaya").slice(0, 4);
  return (
    <>
      <HeroSection stories={heroStories} />

      <div className="wrap grid grid-cols-1 gap-12 border-t border-rule py-10 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-8">
        <section aria-labelledby="latest-title">
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
            <h2 id="explore-title" className="font-display text-2xl">Jelajahi Artikel</h2>
            <ArticleGallery>
              {gallery.map((article) => (
                <ArticleCard key={article.id} article={article} variant="gallery" />
              ))}
            </ArticleGallery>
          </section>
        )}
        </div>
        <div className="lg:col-span-4">
          <Sidebar />
        </div>
      </div>

      <div className="border-t border-rule">
        <SectionGrid category="Teknologi" items={technology} />
      </div>
      <div className="border-t border-rule">
        <SectionGrid category="Olahraga" items={sports} />
      </div>
      <div className="border-t border-rule">
        <SectionGrid category="Budaya" items={culture} />
      </div>
    </>
  );
}


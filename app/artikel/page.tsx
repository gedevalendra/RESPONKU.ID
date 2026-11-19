import BrandLogo from "@/app/components/layout/BrandLogo";
import ArticleCard from "@/app/components/landing/ArticleCard";
import { compareArticlePopularity, getPublishedArticles } from "@/lib/data";

import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "/artikel",
  "Artikel Berita Terbaru — ResponKu",
  "Baca artikel berita terbaru dari ResponKu, mulai dari teknologi, ekonomi, politik, olahraga, hingga budaya.",
);

export const dynamic = "force-dynamic";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const articles = await getPublishedArticles();
  const sorted =
    searchParams.sort === "popular"
      ? [...articles].sort(compareArticlePopularity)
      : articles;
  return (
    <div className="wrap py-10 sm:py-14">
      <p className="eyebrow">Arsip <BrandLogo /></p>
      <h1 className="mt-2 font-display text-display-lg">
        {searchParams.sort === "popular"
          ? "Artikel terpopuler"
          : "Artikel terbaru"}
      </h1>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.length === 0 ? (
          <p className="col-span-full border-y border-rule py-8 text-mute">
            Belum ada artikel yang diterbitkan.
          </p>
        ) : (
          sorted.map((article) => (
            <ArticleCard key={article.id} article={article} variant="archive" />
          ))
        )}
      </div>
    </div>
  );
}

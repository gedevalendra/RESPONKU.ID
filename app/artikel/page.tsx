import ArticleCard from "@/app/components/landing/ArticleCard";
import { getPublishedArticles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ArticlesPage({ searchParams }: { searchParams: { sort?: string } }) {
  const articles = await getPublishedArticles();
  const sorted = searchParams.sort === "popular" ? [...articles].sort((a, b) => b.views - a.views) : articles;
  return <div className="wrap py-10 sm:py-14">
    <p className="eyebrow">Arsip ResponKu</p>
    <h1 className="mt-2 font-display text-display-lg">{searchParams.sort === "popular" ? "Artikel terpopuler" : "Artikel terbaru"}</h1>
    <div className="mt-8 max-w-4xl divide-y divide-rule">
      {sorted.length === 0 ? <p className="border-t border-rule py-8 text-mute">Belum ada artikel yang diterbitkan.</p> : sorted.map((article) => <ArticleCard key={article.id} article={article} />)}
    </div>
  </div>;
}

import { notFound } from "next/navigation";
import ArticleCard from "@/app/components/landing/ArticleCard";
import { getPublishedArticles } from "@/lib/data";
import { slugifyCategory } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const articles = await getPublishedArticles();
  const category = articles.map((article) => article.category).find((value) => slugifyCategory(value) === params.slug);
  if (!category) notFound();
  const filtered = articles.filter((article) => slugifyCategory(article.category) === params.slug);
  return <div className="wrap py-10 sm:py-14">
    <p className="eyebrow">Kanal berita</p>
    <h1 className="mt-2 font-display text-display-lg">{category}</h1>
    <div className="mt-8 max-w-4xl divide-y divide-rule">
      {filtered.map((article) => <ArticleCard key={article.id} article={article} />)}
    </div>
  </div>;
}

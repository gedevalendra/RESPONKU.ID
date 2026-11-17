import { Article, Category } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import ArticleCard from "./ArticleCard";

const categorySlug: Record<Category, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

export default function SectionGrid({
  category,
  items,
}: {
  category: Category;
  items: Article[];
}) {
  return (
    <section className="wrap py-10">
      <SectionHeading
        title={category}
        href={`/kategori/${categorySlug[category]}`}
      />
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ArticleCard key={item.id} article={item} variant="stacked" />
        ))}
      </div>
    </section>
  );
}

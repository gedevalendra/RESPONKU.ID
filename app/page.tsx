import HeroSection from "./components/landing/HeroSection";
import SectionGrid from "./components/landing/SectionGrid";
import Sidebar from "./components/layout/Sidebar";
import ArticleCard from "./components/landing/ArticleCard";
import { getFeatured, getByCategory } from "@/lib/data";
import { Article } from "@/lib/types";

export default async function HomePage() {
  const featured = await getFeatured();
  const [economy, politics, technology, sports, culture] = await Promise.all([
    getByCategory("Ekonomi", 1),
    getByCategory("Politik", 1),
    getByCategory("Teknologi", 2),
    getByCategory("Olahraga", 4),
    getByCategory("Budaya", 4),
  ]);
  return (
    <>
      <HeroSection stories={featured} />

      <div className="wrap grid grid-cols-1 gap-12 border-t border-rule py-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <div className="flex items-baseline justify-between border-b border-ink pb-3">
            <h2 className="font-display text-display-md">Terbaru</h2>
          </div>
          <div className="divide-y divide-rule">
            {economy.concat(politics, technology).map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </div>
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

function ArticleRow({ article }: { article: Article }) {
  return <ArticleCard article={article} variant="row" />;
}

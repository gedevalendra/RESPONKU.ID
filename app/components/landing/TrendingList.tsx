import type { Article } from "@/lib/types";
import { formatViews } from "@/lib/content";
import ArticleRankingList from "./ArticleRankingList";

export default function TrendingList({ items }: { items: Article[] }) {
  return (
    <ArticleRankingList
      title="Terpopuler"
      period="Sejak terbit"
      items={items.map((article) => ({
        article,
        caption: `${formatViews(article.views)} total tayangan`,
        promoted: article.promoted,
      }))}
      emptyMessage="Belum ada artikel terbit."
    />
  );
}

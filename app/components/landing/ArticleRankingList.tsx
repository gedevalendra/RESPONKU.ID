import Link from "next/link";
import type { Article } from "@/lib/types";

type RankingItem = {
  article: Pick<Article, "id" | "slug" | "title" | "thumbnailUrl">;
  caption: string;
  promoted?: boolean;
};

export default function ArticleRankingList({ title, period, items, emptyMessage }: {
  title: string;
  period: string;
  items: RankingItem[];
  emptyMessage: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
        <h2 className="font-display text-xl">{title}</h2>
        <span className="eyebrow">{period}</span>
      </div>
      {items.length > 0 ? (
        <ol className="divide-y divide-rule">
          {items.map(({ article, caption, promoted }, index) => (
            <li key={article.id}>
              <Link href={`/artikel/${encodeURIComponent(article.slug)}`} className="group flex items-center gap-3 py-3">
                <span aria-hidden="true" className="w-6 shrink-0 text-center font-mono text-lg font-semibold text-blue-700">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">{article.title}</p>
                  <p className="mt-1 text-xs text-mute">
                    {caption}
                    {promoted && <span className="text-blue-700"> · Prioritas redaksi</span>}
                  </p>
                </div>
                {article.thumbnailUrl ? (
                  <img src={article.thumbnailUrl} alt="" loading="lazy" className="size-12 shrink-0 rounded-sm object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-gray-100 text-mute" aria-hidden="true">
                    <i className="bx bx-news text-xl" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      ) : <p className="py-4 text-sm text-mute">{emptyMessage}</p>}
    </div>
  );
}

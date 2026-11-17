import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";
import CategoryBadge from "./CategoryBadge";

export default function ArticleCard({
  article,
  variant = "row",
}: {
  article: Article;
  /** row: horizontal list item. stacked: photo on top, for grid layouts. */
  variant?: "row" | "stacked";
}) {
  if (variant === "stacked") {
    return (
      <article className="group flex flex-col">
        <Link
          href={`/artikel/${article.slug}`}
          className="photo-tone aspect-[4/3] w-full"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="flex flex-1 flex-col pt-4">
          <CategoryBadge category={article.category} />
          <h3 className="mt-2 font-display text-lg leading-snug">
            <Link
              href={`/artikel/${article.slug}`}
              className="decoration-1 underline-offset-4 group-hover:underline"
            >
              {article.title}
            </Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-mute">{article.dek}</p>
          <p className="mt-3 font-mono text-[11px] text-mute">
            {article.author} · {formatDate(article.date)}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex gap-5 py-5">
      <Link
        href={`/artikel/${article.slug}`}
        className="photo-tone hidden h-24 w-32 shrink-0 sm:block"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="flex flex-1 flex-col justify-center">
        <CategoryBadge category={article.category} />
        <h3 className="mt-1.5 font-display text-lg leading-snug sm:text-xl">
          <Link
            href={`/artikel/${article.slug}`}
            className="decoration-1 underline-offset-4 group-hover:underline"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 font-mono text-[11px] text-mute">
          {article.author} · {formatDate(article.date)} · {article.readTime} menit baca
        </p>
      </div>
    </article>
  );
}

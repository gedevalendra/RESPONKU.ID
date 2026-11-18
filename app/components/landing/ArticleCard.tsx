import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";
import CategoryBadge from "./CategoryBadge";

export default function ArticleCard({
  article,
  variant = "row",
}: {
  article: Article;
  variant?: "row" | "stacked" | "gallery";
}) {
  if (variant === "gallery") {
    return (
      <article className="flex h-full min-w-0 flex-col border border-rule bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
        <Link href={`/artikel/${article.slug}`} className="group flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2">
          <div className={`relative aspect-[16/10] overflow-hidden ${article.thumbnailUrl ? "bg-gray-100" : "bg-gradient-to-br from-slate-100 to-blue-100"}`}>
            {article.thumbnailUrl ? (
              <img src={article.thumbnailUrl} alt="" loading="lazy"
                className="h-full w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />
            ) : (
              <i className="bx bx-news absolute bottom-3 right-3 text-5xl text-slate-400" aria-hidden="true" />
            )}
            <span className="absolute left-3 top-3 bg-white px-2.5 py-1 text-xs font-medium text-ink">{article.category}</span>
          </div>
          <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
            <h3 className="line-clamp-4 break-words font-display text-base leading-snug group-hover:underline lg:text-xl group-hover:underline-offset-4">{article.title}</h3>
            {article.dek && <p className="mt-2 line-clamp-2 text-sm leading-6 text-mute">{article.dek}</p>}
            <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-mute">
              <span className="inline-flex items-center gap-1"><i className="bx bx-calendar text-base" aria-hidden="true" />{formatDate(article.date)}</span>
              <span className="inline-flex items-center gap-1"><i className="bx bx-time-five text-base" aria-hidden="true" />{article.readTime} menit baca</span>
            </p>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "stacked") {
    return (
      <article className="group flex flex-col">
        <Link
          href={`/artikel/${article.slug}`}
          className="block aspect-[4/3] w-full overflow-hidden bg-gray-100"
          aria-hidden="true"
          tabIndex={-1}
        >
          {article.thumbnailUrl && <img src={article.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </Link>
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
        className="hidden h-24 w-32 shrink-0 overflow-hidden bg-gray-100 sm:block"
        aria-hidden="true"
        tabIndex={-1}
      >
        {article.thumbnailUrl && <img src={article.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </Link>
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
          {article.author} · {formatDate(article.date)} · {article.readTime}{" "}
          menit baca
        </p>
      </div>
    </article>
  );
}

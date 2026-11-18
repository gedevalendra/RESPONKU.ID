import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";

export default function ArticleCard({
  article,
  variant = "row",
  authorAvatarUrl,
}: {
  article: Article;
  variant?: "row" | "stacked" | "gallery";
  authorAvatarUrl?: string;
}) {
  if (variant === "gallery") {
    return (
      <article className="flex h-full min-w-0 flex-col border border-rule bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
        <Link href={`/artikel/${article.slug}`} className="group flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2">
          <div className={`relative aspect-[16/7] overflow-hidden sm:aspect-[16/10] ${article.thumbnailUrl ? "bg-gray-100" : "bg-gradient-to-br from-slate-100 to-blue-100"}`}>
            {article.thumbnailUrl ? (
              <img src={article.thumbnailUrl} alt="" loading="lazy"
                className="h-full w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />
            ) : (
              <i className="bx bx-news absolute bottom-3 right-3 text-5xl text-slate-400" aria-hidden="true" />
            )}
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
          <h3 className="font-display text-lg leading-snug">
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
        className="h-20 w-28 shrink-0 overflow-hidden bg-gray-100 sm:h-20 sm:w-32"
        aria-hidden="true"
        tabIndex={-1}
      >
        {article.thumbnailUrl && <img src={article.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="line-clamp-2 font-display text-lg leading-snug sm:text-xl">
          <Link
            href={`/artikel/${article.slug}`}
            className="decoration-1 underline-offset-4 group-hover:underline"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-mute">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
            <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50 text-blue-600">
              {authorAvatarUrl ? <img src={authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : <i className="bx bxs-user text-sm" aria-hidden="true" />}
            </span>
            {article.author}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(article.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readTime} menit baca</span>
          <span aria-hidden="true">·</span>
          <span>{article.views.toLocaleString("id-ID")} dibaca</span>
        </p>
      </div>
    </article>
  );
}

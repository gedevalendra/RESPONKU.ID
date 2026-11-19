import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";

export default function ArticleCard({
  article,
  variant = "row",
  authorAvatarUrl,
}: {
  article: Article;
  variant?: "row" | "stacked" | "gallery" | "archive";
  authorAvatarUrl?: string;
}) {
  if (variant === "gallery" || variant === "archive") {
    const archive = variant === "archive";
    return (
      <article className={`flex h-full min-w-0 flex-col border border-rule bg-white shadow-sm transition-shadow hover:shadow-md ${archive ? "" : "p-2"}`}>
        <Link href={`/artikel/${article.slug}`} className="group flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2">
          <div className={`relative overflow-hidden ${archive ? "aspect-[16/10]" : "aspect-[16/7] sm:aspect-[16/10]"} ${article.thumbnailUrl ? "bg-gray-100" : "bg-gradient-to-br from-slate-100 to-blue-100"}`}>
            {article.thumbnailUrl ? (
              <img src={article.thumbnailUrl} alt="" loading="lazy"
                className="h-full w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105" />
            ) : (
              <i className="bx bx-news absolute bottom-3 right-3 text-5xl text-slate-400" aria-hidden="true" />
            )}
            {archive && <span className="absolute right-0 top-0 bg-blue-500 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-white">{article.category}</span>}
          </div>
          <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
            <h3 className={`break-words font-display leading-snug group-hover:underline group-hover:underline-offset-4 ${archive ? "line-clamp-3 text-lg" : "line-clamp-4 text-base lg:text-xl"}`}>{article.title}</h3>
            {article.dek && <p className={`mt-2 text-sm leading-6 text-mute ${archive ? "line-clamp-4" : "line-clamp-2"}`}>{article.dek}</p>}
            <p className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-rule pt-3 text-xs text-mute">
              <span className="inline-flex items-center gap-1"><i className="bx bx-calendar text-base" aria-hidden="true" />{formatDate(article.date)}</span>
              {archive ? <span>{article.views.toLocaleString("id-ID")} tayangan</span> : <span className="inline-flex items-center gap-1"><i className="bx bx-time-five text-base" aria-hidden="true" />{article.readTime} menit baca</span>}
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

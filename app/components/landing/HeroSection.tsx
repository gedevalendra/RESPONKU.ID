import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";
import { publicProfile } from "@/lib/community";

export default async function HeroSection({ stories }: { stories: Article[] }) {
  const [lead] = stories;
  if (!lead) return null;
  const authorAvatarUrl = lead.authorId
    ? (await publicProfile(lead.authorId).catch(() => null))?.avatarUrl || ""
    : "";

  return (
    <section className="w-full">
      <article className="group relative min-h-[18rem] overflow-hidden bg-ink sm:aspect-[16/9] sm:min-h-0 lg:aspect-auto lg:min-h-[34rem]">
        <Link href={`/artikel/${lead.slug}`} className="absolute inset-0 block">
          {lead.thumbnailUrl ? (
            <img src={lead.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : <span className="photo-tone block h-full w-full" />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/10" />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
          <h1 className="line-clamp-2 max-w-3xl font-display text-xl leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] sm:text-3xl lg:text-4xl">
            <Link href={`/artikel/${lead.slug}`} className="underline-offset-4 group-hover:underline">{lead.title}</Link>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1.5 font-medium text-white">
              <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 text-white">
                {authorAvatarUrl ? <img src={authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : <i className="bx bxs-user text-sm" aria-hidden="true" />}
              </span>
              {lead.author}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(lead.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{lead.readTime} menit baca</span>
            <span aria-hidden="true">·</span>
            <span>{lead.views.toLocaleString("id-ID")} dibaca</span>
          </p>
        </div>
      </article>
    </section>
  );
}

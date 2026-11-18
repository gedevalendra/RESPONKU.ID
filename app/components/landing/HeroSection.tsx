import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";
import CategoryBadge from "./CategoryBadge";

export default function HeroSection({ stories }: { stories: Article[] }) {
  const [lead] = stories;
  if (!lead) return null;

  return (
    <section className="wrap pb-10 pt-8 lg:pt-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <article className="group relative aspect-[16/9] overflow-hidden bg-ink lg:col-span-12 lg:aspect-auto lg:min-h-[34rem]">
          <Link href={`/artikel/${lead.slug}`} className="absolute inset-0 block">
            {lead.thumbnailUrl ? (
              <img src={lead.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            ) : <span className="photo-tone block h-full w-full" />}
            <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
          </Link>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
            <CategoryBadge category={lead.category} tone="on-photo" />
            <h1 className="mt-3 max-w-3xl font-display text-xl leading-tight sm:text-3xl lg:text-4xl">
              <Link href={`/artikel/${lead.slug}`} className="underline-offset-4 group-hover:underline">{lead.title}</Link>
            </h1>
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm text-white/75 sm:line-clamp-none sm:text-base">{lead.dek}</p>
            <p className="mt-4 font-mono text-[11px] text-white/70">{lead.author} · {formatDate(lead.date)} · {lead.readTime} menit baca</p>
          </div>
        </article>

      </div>
    </section>
  );
}

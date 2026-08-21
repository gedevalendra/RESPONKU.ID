import Link from "next/link";
import { Article } from "@/lib/types";
import { formatDate } from "@/lib/data";
import CategoryBadge from "./CategoryBadge";

export default function HeroSection({ stories }: { stories: Article[] }) {
  const [lead, ...secondary] = stories;
  if (!lead) return null;

  return (
    <section className="wrap grid grid-cols-1 gap-10 pb-10 pt-8 lg:grid-cols-12 lg:pt-12">
      {/* lead story */}
      <article className="group lg:col-span-7">
        {lead.breaking && (
          <span className="mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest2 text-signal">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            Breaking
          </span>
        )}
        <Link href={`/artikel/${lead.slug}`} className="photo-tone block aspect-[16/10] w-full">
          <span className="sr-only">{lead.title}</span>
        </Link>
        <div className="pt-5">
          <CategoryBadge category={lead.category} />
          <h1 className="mt-3 font-display text-display-lg">
            <Link href={`/artikel/${lead.slug}`} className="underline-offset-4 group-hover:underline">
              {lead.title}
            </Link>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-mute sm:text-lg">{lead.dek}</p>
          <p className="mt-5 font-mono text-[11px] text-mute">
            {lead.author} · {formatDate(lead.date)} · {lead.readTime} menit baca
          </p>
        </div>
      </article>

      {/* secondary stories */}
      <div className="flex flex-col divide-y divide-rule lg:col-span-5 lg:border-l lg:border-rule lg:pl-10">
        {secondary.map((story) => (
          <article key={story.id} className="group py-6 first:pt-0 lg:first:pt-0">
            <CategoryBadge category={story.category} />
            <h2 className="mt-2 font-display text-xl leading-snug sm:text-2xl">
              <Link href={`/artikel/${story.slug}`} className="underline-offset-4 group-hover:underline">
                {story.title}
              </Link>
            </h2>
            <p className="mt-3 font-mono text-[11px] text-mute">
              {story.author} · {formatDate(story.date)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

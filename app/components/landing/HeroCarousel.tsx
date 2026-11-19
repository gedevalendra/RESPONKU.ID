"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/content";

type HeroStory = { article: Article; authorAvatarUrl: string };

export default function HeroCarousel({ stories }: { stories: HeroStory[] }) {
  const [slide, setSlide] = useState({ active: 0, previous: -1, direction: 1 });
  const [paused, setPaused] = useState(false);
  const current = stories[slide.active];

  useEffect(() => {
    if (stories.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setSlide((currentSlide) => ({
        active: (currentSlide.active + 1) % stories.length,
        previous: currentSlide.active,
        direction: 1,
      }));
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, stories.length]);

  if (!current) return null;

  return (
    <section className="w-full" aria-roledescription="carousel" aria-label="Berita utama">
      <article
        className="group relative min-h-[18rem] overflow-hidden bg-ink sm:aspect-[16/9] sm:min-h-0 lg:aspect-auto lg:min-h-[34rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <Link href={`/artikel/${current.article.slug}`} className="absolute inset-0 block" aria-label={`Baca ${current.article.title}`}>
          {stories.map(({ article }, index) => {
            const offset = index === slide.active
              ? "0%"
              : index === slide.previous
                ? `${slide.direction * -100}%`
                : `${slide.direction * 100}%`;
            return article.thumbnailUrl ? (
              <img
                key={article.id}
                src={article.thumbnailUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
                style={{ transform: `translateX(${offset})` }}
              />
            ) : (
              <span
                key={article.id}
                className="photo-tone absolute inset-0 block transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(${offset})` }}
              />
            );
          })}
          <span className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/10" />
        </Link>

        {slide.previous >= 0 && stories[slide.previous] && (
          <div key={`leaving-${stories[slide.previous].article.id}`} aria-hidden="true" className="hero-caption-exit pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white sm:p-8">
            <p className="line-clamp-2 max-w-3xl font-display text-xl leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] sm:text-3xl lg:text-4xl">{stories[slide.previous].article.title}</p>
            <p className="mt-3 text-[11px] text-white/80">{stories[slide.previous].article.author} · {formatDate(stories[slide.previous].article.date)} · {stories[slide.previous].article.readTime} menit baca</p>
          </div>
        )}
        <div key={current.article.id} className="hero-caption-enter pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 text-white sm:p-8">
          <h1 className="line-clamp-2 max-w-3xl font-display text-xl leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] sm:text-3xl lg:text-4xl">
            <Link href={`/artikel/${current.article.slug}`} className="pointer-events-auto underline-offset-4 group-hover:underline">{current.article.title}</Link>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1.5 font-medium text-white">
              <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 text-white">
                {current.authorAvatarUrl ? <img src={current.authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : <i className="bx bxs-user text-sm" aria-hidden="true" />}
              </span>
              {current.article.author}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(current.article.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{current.article.readTime} menit baca</span>
            <span aria-hidden="true">·</span>
            <span>{current.article.views.toLocaleString("id-ID")} dibaca</span>
          </p>
        </div>
      </article>
    </section>
  );
}

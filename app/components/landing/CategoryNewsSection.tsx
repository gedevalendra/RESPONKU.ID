"use client";

import Link from "next/link";
import { useState } from "react";
import ArticleCard from "@/app/components/landing/ArticleCard";
import { categories, categorySlug } from "@/lib/content";
import type { Article, Category } from "@/lib/types";

export default function CategoryNewsSection({ articles }: { articles: Article[] }) {
  const availableCategories = categories.filter((category) => articles.some((article) => article.category === category));
  const [category, setCategory] = useState<Category>(availableCategories[0] || categories[0]);
  const stories = articles.filter((article) => article.category === category).slice(0, 3);

  if (!availableCategories.length) return null;

  return (
    <section className="border-t border-rule" aria-labelledby="category-news-title">
      <div className="wrap py-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
          <div>
            <p className="eyebrow">Kanal ResponKu</p>
            <h2 id="category-news-title" className="mt-1 font-display text-2xl sm:text-3xl">Berita berdasarkan kategori</h2>
          </div>
          <Link href={`/kategori/${categorySlug[category]}`} className="text-sm font-medium text-blue-700 hover:underline">Semua berita {category} →</Link>
        </div>
        <div role="tablist" aria-label="Pilih kategori berita" className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {availableCategories.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)}
              className="shrink-0 border border-rule px-4 py-2 text-sm font-medium hover:bg-gray-50 aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white">
              {item}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((article) => <ArticleCard key={article.id} article={article} variant="archive" />)}
        </div>
      </div>
    </section>
  );
}

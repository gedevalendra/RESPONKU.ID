"use client";

import Link from "next/link";
import { slugifyCategory } from "@/lib/content";

export default function ArticleNavMenu({
  categories,
}: {
  categories: string[];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        className="flex items-center gap-1 whitespace-nowrap font-mono text-xs uppercase tracking-widest2 text-gray-800 transition-colors hover:text-blue-500 group-hover:text-blue-500"
      >
        Artikel <i className="bx bx-chevron-down text-base" aria-hidden="true" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 translate-y-2 bg-white p-2 opacity-0 shadow-xl ring-1 ring-gray-100 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 before:absolute before:inset-x-0 before:-top-2 before:h-2 before:content-['']">
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-gray-100 bg-white" />
        <Link
          href="/artikel"
          className="block px-3 py-2.5 font-mono text-xs uppercase tracking-widest2 transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          Semua artikel
        </Link>
        {categories.length > 0 && (
          <div className="my-1 border-t border-gray-100" />
        )}
        {categories.map((category) => (
          <Link
            key={category}
            href={`/kategori/${slugifyCategory(category)}`}
            className="block px-3 py-2.5 font-mono text-xs uppercase tracking-widest2 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            {category}
          </Link>
        ))}
        {categories.length === 0 && (
          <p className="px-3 py-2 font-mono text-[10px] normal-case tracking-normal text-gray-500">
            Belum ada kategori artikel terbit.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { Children, useId, useState, type ReactNode } from "react";

export default function ArticleGallery({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const cards = Children.toArray(children);
  const collapsed = !expanded && cards.length > 2;

  return (
    <div className="relative mt-5">
      <div id={id} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {cards.map((card, index) => (
          <div key={index} className={collapsed && index >= 2
            ? index < 4 ? "min-w-0 max-h-20 overflow-hidden sm:max-h-none sm:overflow-visible" : "hidden min-w-0 sm:block"
            : "min-w-0"}>
            {card}
          </div>
        ))}
      </div>
      {collapsed && (
        <div className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-linear-to-b from-transparent to-paper to-75% pb-1 sm:hidden">
          <button type="button" aria-controls={id} aria-expanded={expanded} onClick={() => setExpanded(true)}
            className="inline-flex min-h-11 items-center gap-2 bg-gray-800 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2">
            Selengkapnya
            <i className="bx bx-chevron-down text-lg" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function ArticleGallery({ children }: { children: ReactNode }) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const cards = Children.toArray(children);
  const [edges, setEdges] = useState({ start: true, end: true });

  function updateEdges() {
    const track = viewport.current;
    if (!track) return;
    const start = track.scrollLeft <= 1;
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    setEdges((previous) => previous.start === start && previous.end === end ? previous : { start, end });
  }

  useEffect(() => {
    const track = viewport.current;
    if (!track) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    updateEdges();
    return () => observer.disconnect();
  }, [cards.length]);

  function move(direction: -1 | 1) {
    const track = viewport.current;
    const first = track?.children[0];
    const second = track?.children[1];
    if (!track || !first || !second) return;
    const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    track.scrollBy({ left: step * direction });
  }

  const arrowClass = "grid size-11 place-items-center border border-rule text-ink hover:bg-gray-100 disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className="mt-5">
      <div
        id={id}
        ref={viewport}
        onScroll={updateEdges}
        tabIndex={edges.start && edges.end ? undefined : 0}
        role="group"
        aria-label="Slider Jelajahi Artikel"
        className="article-gallery-track grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col gap-4 overflow-x-auto pb-2 motion-safe:scroll-smooth lg:auto-cols-[calc((100%_-_1rem)/2)]"
      >
        {cards.map((card, index) => (
          <div key={index} className="min-w-0 snap-start">
            {card}
          </div>
        ))}
      </div>
      {!(edges.start && edges.end) && (
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" aria-controls={id} aria-label="Artikel sebelumnya" disabled={edges.start} onClick={() => move(-1)} className={arrowClass}>
            <i className="bx bx-chevron-left text-2xl" aria-hidden="true" />
          </button>
          <button type="button" aria-controls={id} aria-label="Artikel berikutnya" disabled={edges.end} onClick={() => move(1)} className={arrowClass}>
            <i className="bx bx-chevron-right text-2xl" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

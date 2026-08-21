"use client";

import { useState } from "react";
import Link from "next/link";
import { categories, categorySlug } from "@/lib/data";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="flex flex-col gap-1.5 p-2"
      >
        <span className="sr-only">Buka menu</span>
        <span className="block h-px w-6 bg-ink" aria-hidden="true" />
        <span className="block h-px w-6 bg-ink" aria-hidden="true" />
        <span className="block h-px w-4 bg-ink" aria-hidden="true" />
      </button>

      {open && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-paper"
        >
          <div className="wrap flex items-center justify-between border-b border-ink py-5">
            <span className="font-display text-2xl">WARTA.</span>
            <button type="button" onClick={() => setOpen(false)} className="p-2">
              <span className="sr-only">Tutup menu</span>
              <span className="font-mono text-sm">Tutup ✕</span>
            </button>
          </div>
          <nav className="wrap flex flex-1 flex-col divide-y divide-rule overflow-y-auto py-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/kategori/${categorySlug[category]}`}
                onClick={() => setOpen(false)}
                className="py-4 font-display text-2xl"
              >
                {category}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

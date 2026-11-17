"use client";

import { useState } from "react";
import Link from "next/link";
import { slugifyCategory } from "@/lib/content";

export default function MobileNav({ authenticated = false, articleCategories = [] }: { authenticated?: boolean; articleCategories?: string[] }) {
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
        <span className="block h-px w-6 bg-gray-800" aria-hidden="true" />
        <span className="block h-px w-6 bg-gray-800" aria-hidden="true" />
        <span className="block h-px w-4 bg-blue-500" aria-hidden="true" />
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
            <Link href="/" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">
              Beranda
            </Link>
            <Link href="/artikel" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">
              Semua Artikel
            </Link>
            <Link href="/artikel?sort=popular" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">
              Terpopuler
            </Link>
            <Link href="/akun" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">
              Akun
            </Link>
            <Link href="/tentang" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">
              Tentang Redaksi
            </Link>
            {authenticated && <Link href="/auth/logout" onClick={() => setOpen(false)} className="py-4 font-display text-2xl">Keluar</Link>}
            {articleCategories.map((category) => (
              <Link
                key={category}
                href={`/kategori/${slugifyCategory(category)}`}
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

import Link from "next/link";
import { categories, categorySlug, getTrending } from "@/lib/data";
import TrendingList from "../../components/landing/TrendingList";
import NewsletterForm from "../../components/landing/NewsletterForm";

export default async function Sidebar() {
  const trending = await getTrending(5);

  return (
    <aside className="flex flex-col gap-10">
      <form action="/cari" role="search" className="hidden lg:block">
        <label htmlFor="sidebar-article-search" className="sr-only">Cari artikel</label>
        <div className="flex gap-2">
          <input id="sidebar-article-search" name="q" type="search" placeholder="Judul, topik, penulis…" className="h-11 min-w-0 flex-1 px-3 text-sm" />
          <button type="submit" aria-label="Cari artikel" className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-ink/90">
            <i className="bx bx-search text-xl" aria-hidden="true" />
          </button>
        </div>
      </form>
      <TrendingList items={trending} />

      <div>
        <p className="eyebrow border-b border-ink pb-3">Kanal</p>
        <nav className="flex flex-col divide-y divide-rule">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/kategori/${categorySlug[category]}`}
              className="flex items-center justify-between py-3 font-display text-lg hover:underline underline-offset-4"
            >
              {category}
              <span className="font-mono text-mute" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <NewsletterForm />
    </aside>
  );
}

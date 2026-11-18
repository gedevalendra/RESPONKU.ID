import { getTrending } from "@/lib/data";
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

      <NewsletterForm />
    </aside>
  );
}

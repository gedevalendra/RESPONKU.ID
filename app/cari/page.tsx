import Link from "next/link";
import { getPublishedArticles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; kategori?: string };
}) {
  const query = (searchParams.q || "").trim();
  const category = searchParams.kategori || "";
  const articles = await getPublishedArticles();
  const categories = [...new Set(articles.map((article) => article.category))];
  const searching = Boolean(query || category);
  const results = articles.filter((article) =>
    (!category || article.category === category) &&
    (!query || [article.title, article.dek, article.category, article.author]
      .join(" ").toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id"))),
  );
  const visible = searching ? results : results.slice(0, 6);

  function categoryUrl(value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (value) params.set("kategori", value);
    return `/cari${params.size ? `?${params}` : ""}`;
  }

  return (
    <div className="wrap py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">

        <form action="/cari" role="search" className="flex items-center gap-2">
          {category && <input type="hidden" name="kategori" value={category} />}
          <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
            <input type="search" aria-label="Kata kunci pencarian berita" name="q" defaultValue={query} placeholder="Cari berita, topik, penulis…" className="h-12 w-full min-w-0 pl-12 pr-3 text-sm" />
          </div>
          <button className="h-12 shrink-0 bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink/90">Cari</button>
        </form>

        {categories.length > 0 && (
          <nav aria-label="Filter kategori berita" className="mt-4 flex flex-wrap gap-2">
            {["", ...categories].map((value) => (
              <Link key={value} href={categoryUrl(value)} aria-current={category === value ? "page" : undefined} className={`px-3 py-2 text-xs transition-colors ${category === value ? "bg-gray-800 text-white" : "bg-gray-800/5 text-mute hover:bg-gray-800/10 hover:text-ink"}`}>
                {value || "Semua topik"}
              </Link>
            ))}
          </nav>
        )}

        <section className="mt-8" aria-labelledby="search-results-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
            <div>
              <h2 id="search-results-title" className="text-lg font-semibold">{searching ? "Hasil pencarian" : "Berita terbaru"}</h2>
              {searching && <p className="mt-1 break-words text-sm text-mute">{results.length} artikel{query ? ` untuk “${query}”` : ""}{category ? ` di ${category}` : ""}</p>}
            </div>
            {searching && <Link href="/cari" className="text-sm text-blue-500 hover:underline">Hapus filter</Link>}
          </div>

          {visible.length ? (
            <div className="divide-y divide-rule">
              {visible.map((article) => (
                <article key={article.id} className="flex items-start gap-4 py-5 sm:gap-5">
                  {article.thumbnailUrl && <Link href={`/artikel/${article.slug}`} tabIndex={-1} aria-hidden="true" className="shrink-0"><img src={article.thumbnailUrl} alt="" loading="lazy" className="h-20 w-24 object-cover sm:h-28 sm:w-40" /></Link>}
                  <div className="min-w-0 flex-1">
                    <h3 className="mt-1 text-base font-semibold leading-snug sm:text-lg"><Link href={`/artikel/${article.slug}`} className="hover:text-blue-500">{article.title}</Link></h3>
                    <p className="mt-2 hidden text-sm leading-6 text-mute sm:line-clamp-2">{article.dek}</p>
                    <p className="mt-2 text-xs leading-5 text-mute">{article.author} · {article.readTime} menit baca</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/[0.03] px-5 py-10 text-center">
              <i className="bx bx-search mb-3 text-3xl text-mute" aria-hidden="true" />
              <h3 className="font-medium">{searching ? "Belum menemukan berita yang cocok" : "Belum ada berita terbit"}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-mute">{searching ? "Coba kata kunci yang lebih singkat atau pilih kategori lain." : "Artikel terbaru akan ditampilkan di sini setelah diterbitkan."}</p>
              {searching && <Link href="/cari" className="mt-4 inline-block text-sm font-medium text-blue-500">Lihat berita terbaru</Link>}
            </div>
          )}
          {!searching && articles.length > 6 && <Link href="/artikel" className="mt-4 block py-3 text-center text-sm font-medium text-blue-500 hover:bg-gray-800/5">Jelajahi semua artikel →</Link>}
        </section>
      </div>
    </div>
  );
}

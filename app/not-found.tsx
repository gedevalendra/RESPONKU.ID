import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found-page relative isolate overflow-hidden border-b border-rule bg-paper">
      <div className="not-found-orb not-found-orb-one" aria-hidden="true" />
      <div className="not-found-orb not-found-orb-two" aria-hidden="true" />
      <div className="not-found-grid absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="wrap flex min-h-[min(680px,calc(100vh-12rem))] items-center py-14 sm:py-20">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          <div className="not-found-number relative text-center lg:text-left" aria-hidden="true">
            <span className="not-found-number-shadow">404</span>
            <span className="not-found-number-main">404</span>
            <span className="not-found-signal"><i className="bx bx-signal-5" /></span>
          </div>
          <div className="not-found-content text-center lg:text-left">
            <p className="eyebrow inline-flex items-center gap-2"><i className="bx bx-compass text-base" aria-hidden="true" />Rute tidak ditemukan</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
              Sepertinya Anda tersesat.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-mute sm:text-lg">
              Halaman atau artikel yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamatnya tidak tepat.
            </p>
            <form action="/cari" role="search" className="mt-7 flex max-w-lg border border-rule bg-white p-1 shadow-sm focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-blue-100">
              <label htmlFor="not-found-search" className="sr-only">Cari artikel</label>
              <input id="not-found-search" name="q" type="search" placeholder="Cari artikel atau topik…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400" />
              <button type="submit" className="inline-flex shrink-0 items-center gap-2 bg-ink px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 sm:px-4">
                <i className="bx bx-search text-base" aria-hidden="true" /><span className="hidden sm:inline">Cari</span>
              </button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/" className="inline-flex min-h-11 items-center gap-2 bg-ink px-5 font-mono text-xs uppercase tracking-widest2 text-white transition-transform hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <i className="bx bx-home-alt-2 text-base" aria-hidden="true" />Ke beranda
              </Link>
              <Link href="/artikel" className="inline-flex min-h-11 items-center gap-2 border border-rule bg-white px-5 font-mono text-xs uppercase tracking-widest2 text-ink transition-colors hover:border-ink hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Jelajahi artikel <i className="bx bx-right-arrow-alt text-lg" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-6 text-xs text-mute">Kode kesalahan: <span className="font-mono text-ink">404 / NOT_FOUND</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}

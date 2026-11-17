import Link from "next/link";
import TickerBar from "../../components/landing/TickerBar";
import MobileNav from "./MobileNav";
import { getActor } from "@/lib/authz";
import AccountMenu from "@/app/components/auth/AccountMenu";
import ArticleNavMenu from "./ArticleNavMenu";
import { listArticleCategories, listTickerHeadlines } from "@/lib/db";

function todayLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function Header() {
  const [actor, articleCategories, tickerHeadlines] = await Promise.all([
    getActor(),
    listArticleCategories(),
    listTickerHeadlines(),
  ]);
  return (
    <header className="sticky top-0 bg-white z-100">
      <div className="wrap flex items-center gap-5 border-b border-gray-100 py-4 sm:py-5 lg:gap-8">
        <Link
          href="/"
          className="font-display text-4xl tracking-tight sm:text-5xl"
        >
          ResponKu
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 xl:gap-8 lg:flex">
          <Link
            href="/"
            className="whitespace-nowrap font-mono text-xs uppercase tracking-widest2 text-gray-800 hover:text-blue-500"
          >
            Beranda
          </Link>
          <ArticleNavMenu categories={articleCategories} />
          <Link
            href="/artikel"
            className="whitespace-nowrap font-mono text-xs uppercase tracking-widest2 text-gray-800 hover:text-blue-500"
          >
            Terbaru
          </Link>
          <Link
            href="/artikel?sort=popular"
            className="whitespace-nowrap font-mono text-xs uppercase tracking-widest2 text-gray-800 hover:text-blue-500"
          >
            Terpopuler
          </Link>
          <Link href="/cari" className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 font-mono text-xs leading-none uppercase tracking-widest2 text-gray-800 outline outline-1 outline-gray-300 transition-colors hover:bg-gray-800/5">
            <i className="bx bx-search inline-flex shrink-0 items-center justify-center text-lg leading-none" aria-hidden="true" />
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:gap-5">
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/tentang"
              className="font-mono text-xs uppercase tracking-widest2 text-gray-500 hover:text-blue-500"
            >
              Tentang
            </Link>
            {actor ? (
              <AccountMenu actor={actor} />
            ) : (
              <Link
                href="/akun"
                className="font-mono text-xs uppercase tracking-widest2 text-gray-500 hover:text-blue-500"
              >
                Akun
              </Link>
            )}
            {!actor && (
              <Link
                href="/masuk"
                className="bg-blue-500 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-blue-600"
              >
                Masuk
              </Link>
            )}
          </div>
          {!actor && (
            <Link
              href="/masuk"
              className="bg-blue-500 px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white lg:hidden"
            >
              Masuk
            </Link>
          )}
          <MobileNav
            authenticated={Boolean(actor)}
            articleCategories={articleCategories}
          />
        </div>
      </div>

      <TickerBar headlines={tickerHeadlines} />
    </header>
  );
}

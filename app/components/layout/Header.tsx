import BrandLogo from "@/app/components/layout/BrandLogo";
import Link from "next/link";
import TickerBar from "../../components/landing/TickerBar";
import MobileNav from "./MobileNav";
import { getActor } from "@/lib/authz";
import AccountMenu from "@/app/components/auth/AccountMenu";
import { countUnreadNotifications } from "@/lib/db";
import NotificationSync from "@/app/components/notifications/NotificationSync";
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
  const unreadCount = actor ? await countUnreadNotifications(actor.id).catch(() => 0) : 0;
  return (
    <header className="sticky top-0 bg-white z-100">
      {actor && <NotificationSync key={actor.id} unreadCount={unreadCount} />}
      <div className="wrap flex items-center gap-5 border-b border-gray-100 py-4 sm:py-5 lg:gap-8">
        <Link
          href="/"
          className="shrink-0"
        >
          <BrandLogo className="block h-10 sm:h-12" />
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
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:gap-5">
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/tentang"
              className="flex h-7 items-center font-mono text-xs uppercase leading-none tracking-widest2 text-gray-500 hover:text-blue-500"
            >
              Tentang
            </Link>
            <Link
              href="/dukungan"
              className="flex h-7 items-center whitespace-nowrap font-mono text-xs uppercase leading-none tracking-widest2 text-gray-500 hover:text-blue-500"
            >
              Dukungan
            </Link>
            {actor ? (
              <AccountMenu actor={actor} unreadCount={unreadCount} />
            ) : (
              <Link
                href="/akun"
                className="flex h-7 items-center font-mono text-xs uppercase leading-none tracking-widest2 text-gray-500 hover:text-blue-500"
              >
                Akun
              </Link>
            )}
            {!actor && (
              <Link
                href="/masuk"
                className="flex h-7 items-center bg-ink px-4 font-mono text-xs uppercase leading-none tracking-widest2 text-white transition-colors hover:bg-gray-700"
              >
                Masuk
              </Link>
            )}
          </div>
          {!actor && (
            <Link
              href="/masuk"
              className="bg-ink px-3 py-2 font-mono text-xs uppercase tracking-widest2 text-white lg:hidden"
            >
              Masuk
            </Link>
          )}
          <MobileNav
            unreadCount={unreadCount}
            authenticated={Boolean(actor)}
            role={actor?.role}
          />
        </div>
      </div>

      <TickerBar headlines={tickerHeadlines} />
    </header>
  );
}

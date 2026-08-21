import Link from "next/link";
import { categories, categorySlug, breakingHeadlines } from "@/lib/data";
import TickerBar from "../../components/landing/TickerBar";
import MobileNav from "./MobileNav";

function todayLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function Header() {
  return (
    <header className="sticky top-0 bg-white z-100">
      {/* nameplate */}
      <div className="rule-thick wrap flex items-center justify-between border-b border-rule py-5 sm:py-6">
        <Link href="/" className="font-display text-4xl tracking-tight sm:text-5xl">
          ResponKu
        </Link>
        <div className="flex items-center gap-4 lg:hidden">
          <Link
            href="/masuk"
            className="border border-ink px-3 py-1.5 font-mono text-xs uppercase tracking-widest2"
          >
            Masuk
          </Link>
          <MobileNav />
        </div>
      </div>

      {/* category nav */}
      <nav className="wrap hidden items-center gap-8 border-b border-rule py-3.5 lg:flex">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/kategori/${categorySlug[category]}`}
            className="font-mono text-xs uppercase tracking-widest2 text-ink/80 hover:text-ink"
          >
            {category}
          </Link>
        ))}
        <Link
          href="/tentang"
          className="ml-auto font-mono text-xs uppercase tracking-widest2 text-mute hover:text-ink"
        >
          Tentang Redaksi
        </Link>
        <Link
          href="/masuk"
          className="border border-ink px-4 py-1.5 font-mono text-xs uppercase tracking-widest2 hover:bg-ink hover:text-paper transition-colors"
        >
          Masuk
        </Link>
      </nav>

      <TickerBar headlines={breakingHeadlines} />
    </header>
  );
}

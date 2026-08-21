import Link from "next/link";
import { categories, breakingHeadlines } from "@/lib/data";
import TickerBar from "../landing/TickerBar";
import MobileNav from "./MobileNav";

const categorySlug: Record<string, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

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
    <header>
      {/* meta strip */}
      <div className="wrap hidden items-center justify-between py-2.5 sm:flex">
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-mute">
          {todayLabel()}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-mute">
          Edisi No. 214 · Bandar Lampung
        </span>
      </div>

      {/* nameplate */}
      <div className="rule-thick wrap flex items-center justify-between border-b border-rule py-5 sm:py-6">
        <Link href="/" className="font-display text-4xl tracking-tight sm:text-5xl">
          WARTA<span className="text-mute">.</span>
        </Link>
        <MobileNav />
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
      </nav>

      <TickerBar headlines={breakingHeadlines} />
    </header>
  );
}

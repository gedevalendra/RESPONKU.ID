import Link from "next/link";
import { categories, getTrending } from "@/lib/data";
import TrendingList from "../landing/TrendingList";
import NewsletterForm from "../landing/NewsletterForm";

const categorySlug: Record<string, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

export default function Sidebar() {
  const trending = getTrending(5);

  return (
    <aside className="flex flex-col gap-10">
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

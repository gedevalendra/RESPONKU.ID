import Link from "next/link";
import { categories, categorySlug, getTrending } from "@/lib/data";
import TrendingList from "../../components/landing/TrendingList";
import NewsletterForm from "../../components/landing/NewsletterForm";

export default async function Sidebar() {
  const trending = await getTrending(5);

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

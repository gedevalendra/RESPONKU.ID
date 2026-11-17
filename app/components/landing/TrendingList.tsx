import Link from "next/link";
import { Article } from "@/lib/types";
import { formatViews } from "@/lib/content";

export default function TrendingList({ items }: { items: Article[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-ink pb-3">
        <h2 className="font-display text-xl">Terpopuler</h2>
        <span className="eyebrow">24 jam</span>
      </div>
      <ol className="divide-y divide-rule">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-4 py-4">
            <span className="font-display text-2xl leading-none text-mute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base leading-snug">
                <Link
                  href={`/artikel/${item.slug}`}
                  className="underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="mt-1.5 font-mono text-[11px] text-mute">
                {formatViews(item.views)} pembaca
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

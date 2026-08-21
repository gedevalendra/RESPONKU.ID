import Link from "next/link";
import { Category } from "@/lib/types";

const categorySlug: Record<Category, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

export default function CategoryBadge({
  category,
  tone = "default",
}: {
  category: Category;
  tone?: "default" | "on-photo";
}) {
  return (
    <Link
      href={`/kategori/${categorySlug[category]}`}
      className={
        tone === "on-photo"
          ? "font-mono text-[11px] uppercase tracking-widest2 text-paper/90 hover:text-paper"
          : "font-mono text-[11px] uppercase tracking-widest2 text-mute hover:text-ink transition-colors"
      }
    >
      {category}
    </Link>
  );
}

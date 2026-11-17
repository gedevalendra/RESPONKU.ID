import type { Category } from "./types";

export const categories: Category[] = [
  "Ekonomi",
  "Teknologi",
  "Politik",
  "Olahraga",
  "Budaya",
];
export const categorySlug: Record<Category, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};
export const slugToCategory: Record<string, Category> = Object.fromEntries(
  Object.entries(categorySlug).map(([category, slug]) => [
    slug,
    category as Category,
  ]),
);
export function slugifyCategory(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}
export const breakingHeadlines: string[] = [];
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
export function formatViews(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}rb` : `${n}`;
}

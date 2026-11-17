import type { Article, Category } from "./types";
export {
  categories,
  categorySlug,
  slugToCategory,
  slugifyCategory,
  breakingHeadlines,
  formatDate,
  formatViews,
} from "./content";
import { listArticlesFromDatabase } from "./db";

export async function getPublishedArticles(): Promise<Article[]> {
  return listArticlesFromDatabase({ status: "published" });
}
export async function getFeatured(): Promise<Article[]> {
  return (await getPublishedArticles()).filter((article) => article.featured);
}
export async function getTrending(limit = 5): Promise<Article[]> {
  return (await getPublishedArticles())
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}
export async function getByCategory(
  category: Category,
  limit?: number,
): Promise<Article[]> {
  const list = (await getPublishedArticles()).filter(
    (article) => article.category === category,
  );
  return typeof limit === "number" ? list.slice(0, limit) : list;
}
export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  return (await getPublishedArticles()).find(
    (article) => article.slug === slug,
  );
}
export async function getRelated(
  article: Article,
  limit = 3,
): Promise<Article[]> {
  return (await getPublishedArticles())
    .filter(
      (item) =>
        item.category === article.category && item.slug !== article.slug,
    )
    .slice(0, limit);
}

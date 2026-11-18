import type { MetadataRoute } from "next";
import { listPublishedArticleIndex } from "@/lib/db";
import { articleUrl, publicationDate, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listPublishedArticleIndex();
  return [
    { url: `${siteOrigin}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteOrigin}/artikel`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteOrigin}/buat-artikel-gratis`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteOrigin}/tentang`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteOrigin}/faq`, changeFrequency: "monthly", priority: 0.5 },
    ...articles.map((article) => ({
      url: articleUrl(article.slug),
      lastModified: publicationDate(article),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

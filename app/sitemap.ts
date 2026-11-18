import type { MetadataRoute } from "next";
import { listPublishedArticleIndex } from "@/lib/db";
import { articleUrl, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listPublishedArticleIndex();
  return [
    { url: `${siteOrigin}/` },
    { url: `${siteOrigin}/artikel` },
    { url: `${siteOrigin}/buat-artikel-gratis` },
    { url: `${siteOrigin}/tentang` },
    { url: `${siteOrigin}/faq` },
    ...articles.map(({ slug }) => ({ url: articleUrl(slug) })),
  ];
}

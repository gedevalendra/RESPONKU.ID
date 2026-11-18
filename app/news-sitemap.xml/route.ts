import { listPublishedArticleIndex } from "@/lib/db";
import { articleUrl, publicationDate } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export async function GET() {
  const now = Date.now();
  const cutoff = now - 48 * 60 * 60 * 1000;
  const articles = await listPublishedArticleIndex();
  const entries = articles.flatMap((article) => {
    const date = publicationDate(article);
    return date && date.getTime() >= cutoff && date.getTime() <= now ? [{ article, date }] : [];
  }).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 1000);

  const urls = entries.map(({ article, date }) => `  <url>
    <loc>${escapeXml(articleUrl(article.slug))}</loc>
    <news:news>
      <news:publication>
        <news:name>ResponKu</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${date.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`).join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}

import { ImageResponse } from "next/og";
import { getArticleFromDatabase, getReactionSummary, listComments } from "@/lib/db";
import { articleImageUrl, siteOrigin } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const article = await getArticleFromDatabase(params.slug);
  if (!article) return new Response("Artikel tidak ditemukan", { status: 404 });

  const [reactions, comments] = await Promise.all([
    getReactionSummary(article.slug).catch(() => ({ like: 0, insightful: 0, celebrate: 0 })),
    listComments(article.slug).catch(() => []),
  ]);
  const thumbnail = articleImageUrl(article.thumbnailUrl);
  const logo = new URL("/image/icon_black.svg", siteOrigin).href;
  const published = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(article.publishedAt || article.date));

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", flexDirection: "column", background: "white", color: "#1f2937", padding: "56px 64px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={logo} width="210" height="56" alt="ResponKu" style={{ width: 210, height: 56, objectFit: "contain", objectPosition: "left center" }} />
        <span style={{ fontSize: 24, color: "#6b7280" }}>{published}</span>
      </div>

      <div style={{ display: "flex", marginTop: 34, fontSize: 23, fontWeight: 600, color: "#6b7280" }}>{article.author}</div>
      <div style={{ display: "flex", marginTop: 14, fontFamily: "Georgia, serif", fontSize: 52, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-1px", maxHeight: 174, overflow: "hidden" }}>
        {article.title}
      </div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 29, lineHeight: 1.35, color: "#6b7280", maxHeight: 118, overflow: "hidden" }}>
        {article.dek}
      </div>

      {thumbnail && (
        <img src={thumbnail} width="1072" height="500" alt="" style={{ marginTop: 32, width: "100%", height: 500, objectFit: "cover" }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 42, marginTop: 30, fontSize: 24, color: "#6b7280" }}>
        <span>♡&nbsp; {new Intl.NumberFormat("id-ID").format(reactions.like)} suka</span>
        <span>▢&nbsp; {new Intl.NumberFormat("id-ID").format(comments.length)} komentar</span>
      </div>

      <div style={{ display: "flex", width: "100%", height: 2, background: "#e5e7eb", marginTop: 30 }} />
      <div style={{ display: "flex", marginTop: 30, fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 700 }}>Ikut berbagi cerita bersama ResponKu</div>
      <div style={{ display: "flex", marginTop: 10, fontSize: 23, color: "#6b7280" }}>Baca, tulis, dan terhubung di responku.id</div>
    </div>,
    {
      width: 1200,
      height: 1200,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}

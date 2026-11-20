import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";
import { articleUrl } from "@/lib/seo";
import { inspectGoogleUrls, isGoogleSearchConsoleConfigured } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  if (!isGoogleSearchConsoleConfigured()) {
    return NextResponse.json({ error: "Pemeriksaan Google Search Console belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const publishedArticles = await listArticlesFromDatabase({ authorId: actor.id, status: "published" });
    if (!publishedArticles.length) return NextResponse.json({ articles: [], checked: 0 });

    const urls = publishedArticles.map((article) => articleUrl(article.slug));
    const inspections = await inspectGoogleUrls(urls);
    const indexedByUrl = new Map(inspections.filter((inspection) => inspection.indexed).map((inspection) => [inspection.url, inspection]));
    const articles = publishedArticles.flatMap((article) => {
      const url = articleUrl(article.slug);
      const inspection = indexedByUrl.get(url);
      return inspection ? [{
        title: article.title,
        url,
        lastCrawlTime: inspection.lastCrawlTime,
        inspectionResultLink: inspection.inspectionResultLink,
      }] : [];
    });

    return NextResponse.json({ articles, checked: publishedArticles.length });
  } catch (error) {
    console.error("Google Search Console inspection failed", error);
    return NextResponse.json({ error: "Google Search Console gagal memeriksa artikel. Periksa akses akun layanan dan properti." }, { status: 502 });
  }
}
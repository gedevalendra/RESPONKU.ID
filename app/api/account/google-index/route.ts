import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { listArticlesFromDatabase } from "@/lib/db";
import { getMongoDb } from "@/lib/mongodb";
import { articleUrl } from "@/lib/seo";
import { inspectGoogleUrls, isGoogleSearchConsoleConfigured } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

type StoredInspection = {
  url: string;
  indexed: boolean;
  lastCrawlTime?: string;
  inspectionResultLink?: string;
};

type StoredSnapshot = {
  ownerId: string;
  inspections: StoredInspection[];
  checked: number;
  checkedAt: string;
};

function toResponseArticles(
  publishedArticles: Awaited<ReturnType<typeof listArticlesFromDatabase>>,
  inspections: StoredInspection[],
) {
  const indexedByUrl = new Map(
    inspections.filter((inspection) => inspection.indexed).map((inspection) => [inspection.url, inspection]),
  );

  return publishedArticles.flatMap((article) => {
    const url = articleUrl(article.slug);
    const inspection = indexedByUrl.get(url);
    return inspection ? [{
      title: article.title,
      url,
      lastCrawlTime: inspection.lastCrawlTime,
    }] : [];
  });
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });

  try {
    const db = await getMongoDb();
    if (!db) return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });

    const publishedArticles = await listArticlesFromDatabase({ authorId: actor.id, status: "published" });
    const snapshot = await db.collection<StoredSnapshot>("google_index_snapshots").findOne({ ownerId: actor.id });
    const inspections = snapshot?.inspections || [];
    const inspectedUrls = new Set(inspections.map((inspection) => inspection.url));
    const hasUninspectedArticles = publishedArticles.some((article) => !inspectedUrls.has(articleUrl(article.slug)));

    return NextResponse.json({
      articles: toResponseArticles(publishedArticles, inspections),
      checked: snapshot?.checked || 0,
      checkedAt: snapshot?.checkedAt,
      refreshDue: !snapshot || hasUninspectedArticles || Date.now() - new Date(snapshot.checkedAt).getTime() >= REFRESH_INTERVAL_MS,
    });
  } catch (error) {
    console.error("Google Search Console cache read failed", error);
    return NextResponse.json({ error: "Data indeks artikel gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  if (!isGoogleSearchConsoleConfigured()) {
    return NextResponse.json({ error: "Pemeriksaan Google Search Console belum dikonfigurasi." }, { status: 503 });
  }

  try {
    const db = await getMongoDb();
    if (!db) return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });

    const requestBody = await request.json().catch(() => undefined) as { force?: boolean } | undefined;
    const snapshots = db.collection<StoredSnapshot>("google_index_snapshots");
    const publishedArticles = await listArticlesFromDatabase({ authorId: actor.id, status: "published" });
    const existing = await snapshots.findOne({ ownerId: actor.id });
    const inspectedUrls = new Set(existing?.inspections.map((inspection) => inspection.url) || []);
    const hasUninspectedArticles = publishedArticles.some((article) => !inspectedUrls.has(articleUrl(article.slug)));
    if (!requestBody?.force && existing && !hasUninspectedArticles && Date.now() - new Date(existing.checkedAt).getTime() < REFRESH_INTERVAL_MS) {
      return NextResponse.json({
        articles: toResponseArticles(publishedArticles, existing.inspections),
        checked: existing.checked,
        checkedAt: existing.checkedAt,
        refreshed: false,
      });
    }

    const urls = publishedArticles.map((article) => articleUrl(article.slug));
    const inspections = await inspectGoogleUrls(urls);
    const snapshot: StoredSnapshot = {
      ownerId: actor.id,
      inspections,
      checked: publishedArticles.length,
      checkedAt: new Date().toISOString(),
    };
    await snapshots.replaceOne({ ownerId: actor.id }, snapshot, { upsert: true });

    return NextResponse.json({
      articles: toResponseArticles(publishedArticles, inspections),
      checked: publishedArticles.length,
      checkedAt: snapshot.checkedAt,
      refreshed: true,
    });
  } catch (error) {
    console.error("Google Search Console inspection failed", error);
    return NextResponse.json({ error: "Google Search Console gagal memeriksa artikel. Periksa akses akun layanan dan properti." }, { status: 502 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getArticleViewCount, recordArticleView } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const views = await getArticleViewCount(params.slug);
  if (views === null) return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ views }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  // View totals are anonymous and do not depend on optional cookie consent.
  const recorded = await recordArticleView(params.slug, {});
  return NextResponse.json(recorded, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

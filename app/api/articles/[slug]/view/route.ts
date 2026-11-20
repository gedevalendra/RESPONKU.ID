import { NextRequest, NextResponse } from "next/server";
import { cookiePreferenceName } from "@/lib/cookie-preferences";
import crypto from "node:crypto";
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
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  if (request.cookies.get(cookiePreferenceName)?.value !== "accept") {
    return NextResponse.json({ recorded: false });
  }
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous";
  const ipHash = crypto.createHash("sha256").update(forwarded).digest("hex");
  const recorded = await recordArticleView(params.slug, {
    ipHash,
    userAgent: request.headers.get("user-agent") || undefined,
  });
  return NextResponse.json(recorded, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

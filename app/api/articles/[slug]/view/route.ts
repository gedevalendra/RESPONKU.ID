import { NextRequest, NextResponse } from "next/server";
import { cookiePreferenceName } from "@/lib/cookie-preferences";
import crypto from "node:crypto";
import { recordArticleView } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  if (request.cookies.get(cookiePreferenceName)?.value !== "accept") {
    return new NextResponse(null, { status: 204 });
  }
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous";
  const ipHash = crypto.createHash("sha256").update(forwarded).digest("hex");
  await recordArticleView(params.slug, {
    ipHash,
    userAgent: request.headers.get("user-agent") || undefined,
  });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { recordArticleView } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const ipHash = crypto.createHash("sha256").update(forwarded).digest("hex");
  await recordArticleView(params.slug, { ipHash, userAgent: request.headers.get("user-agent") || undefined });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { addReaction, getReactionSummary } from "@/lib/db";

const schema = z.object({ articleSlug: z.string().min(1), reaction: z.enum(["like", "insightful", "celebrate"]), visitorId: z.string().min(8).max(100) });

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("articleSlug");
  if (!slug) return NextResponse.json({ error: "articleSlug wajib diisi" }, { status: 400 });
  try { return NextResponse.json(await getReactionSummary(slug)); } catch { return NextResponse.json({ like: 0, insightful: 0, celebrate: 0 }); }
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Reaksi tidak valid" }, { status: 422 });
  try { return NextResponse.json(await addReaction(parsed.data.articleSlug, parsed.data.reaction, parsed.data.visitorId)); }
  catch { return NextResponse.json({ error: "Reaksi gagal disimpan" }, { status: 503 }); }
}

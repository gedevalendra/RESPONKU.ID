import { NextResponse } from "next/server";
import { z } from "zod";
import { createArticle, listArticlesFromDatabase } from "@/lib/db";
import { getActor } from "@/lib/authz";

const block = z.discriminatedUnion("type", [z.object({ id: z.string().min(1).max(80), type: z.literal("text"), text: z.string().min(1).max(20000) }), z.object({ id: z.string().min(1).max(80), type: z.literal("heading"), text: z.string().min(1).max(300) }), z.object({ id: z.string().min(1).max(80), type: z.literal("image"), url: z.string().url().max(2000), alt: z.string().min(1).max(200), caption: z.string().max(500).optional() }), z.object({ id: z.string().min(1).max(80), type: z.literal("quote"), text: z.string().min(1).max(2000), attribution: z.string().max(200).optional() }), z.object({ id: z.string().min(1).max(80), type: z.literal("divider") })]);
const input = z.object({ title: z.string().min(5).max(180), dek: z.string().min(10).max(500), category: z.enum(["Ekonomi", "Teknologi", "Politik", "Olahraga", "Budaya"]), author: z.string().min(2).max(100), readTime: z.number().int().min(1).max(60), content: z.array(z.string().min(1).max(20000)).default([]), contentBlocks: z.array(block).min(1) });

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  return NextResponse.json({ articles: await listArticlesFromDatabase({ authorId: actor.id }) });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data artikel tidak valid" }, { status: 422 });
  try { return NextResponse.json({ article: await createArticle(parsed.data, actor, "pending") }, { status: 201 }); } catch { return NextResponse.json({ error: "Artikel gagal dikirim" }, { status: 503 }); }
}

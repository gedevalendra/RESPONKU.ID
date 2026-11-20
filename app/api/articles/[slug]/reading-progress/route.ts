import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { getArticleReadingProgress, saveArticleReadingProgress } from "@/lib/db";

const input = z.object({ progress: z.number().min(0).max(1), anchorText: z.string().max(240).optional() });

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  return NextResponse.json(await getArticleReadingProgress(actor.id, params.slug), { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Progres baca tidak valid" }, { status: 422 });
  const saved = await saveArticleReadingProgress(actor.id, params.slug, parsed.data.progress, parsed.data.anchorText);
  if (!saved) return NextResponse.json({ error: "Progres baca belum dapat disimpan" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { analyzeArticle } from "@/lib/article-analysis";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = z.object({ title: z.string().max(180), dek: z.string().max(500), content: z.array(z.string().max(20000)).max(200) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Isi artikel tidak valid" }, { status: 422 });
  try { return NextResponse.json(await analyzeArticle(parsed.data)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Analisis gagal" }, { status: 503 }); }
}

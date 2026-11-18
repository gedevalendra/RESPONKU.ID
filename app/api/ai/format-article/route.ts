import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/authz";
import { formatArticleFromFreeform } from "@/lib/article-formatting";

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = z.object({ source: z.string().trim().min(20).max(50000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Naskah terlalu pendek atau terlalu panjang" }, { status: 422 });
  try {
    return NextResponse.json(await formatArticleFromFreeform(parsed.data.source));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Format artikel gagal" }, { status: 503 });
  }
}

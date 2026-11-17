import { NextResponse } from "next/server";
import { z } from "zod";
import { createArticle, listArticlesFromDatabase } from "@/lib/db";
import { getActor, isStaff } from "@/lib/authz";

const input = z.object({ title: z.string().min(5).max(180), dek: z.string().min(10).max(500), category: z.enum(["Ekonomi", "Teknologi", "Politik", "Olahraga", "Budaya"]), author: z.string().min(2).max(100), readTime: z.number().int().min(1).max(60), content: z.array(z.string().min(20).max(10000)).min(1), featured: z.boolean().optional(), breaking: z.boolean().optional(), status: z.enum(["draft", "pending", "published", "rejected"]).optional(), rejectionReason: z.string().max(500).optional() });

export async function GET() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  return NextResponse.json({ articles: await listArticlesFromDatabase({}) });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat membuat artikel dari panel editorial" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data artikel tidak valid" }, { status: 422 });
  try { return NextResponse.json({ article: await createArticle(parsed.data, actor, parsed.data.status || "published") }, { status: 201 }); } catch { return NextResponse.json({ error: "Artikel gagal disimpan" }, { status: 503 }); }
}

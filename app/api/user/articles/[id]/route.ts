import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteArticle, updateArticle } from "@/lib/db";
import { getActor } from "@/lib/authz";

const block = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("text"),
    text: z.string().min(1).max(20000),
  }),
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("heading"),
    text: z.string().min(1).max(300),
  }),
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("image"),
    url: z.string().url().max(2000),
    alt: z.string().min(1).max(200),
    caption: z.string().max(500).optional(),
  }),
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("quote"),
    text: z.string().min(1).max(2000),
    attribution: z.string().max(200).optional(),
  }),
  z.object({ id: z.string().min(1).max(80), type: z.literal("divider") }),
]);
const patchSchema = z.object({
  title: z.string().min(5).max(180),
  dek: z.string().min(10).max(500),
  thumbnailUrl: z.string().url().max(3000),
  category: z.enum(["Ekonomi", "Teknologi", "Politik", "Olahraga", "Budaya"]),
  author: z.string().min(2).max(100),
  readTime: z.number().int().min(1).max(60),
  content: z.array(z.string().min(1).max(20000)).default([]),
  contentBlocks: z.array(block).min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Data artikel tidak valid" },
      { status: 422 },
    );
  try {
    const current = (await listOwned(actor.id, params.id))[0];
    if (!current)
      return NextResponse.json(
        { error: "Artikel tidak ditemukan" },
        { status: 404 },
      );
    return NextResponse.json({
      article: await updateArticle(
        params.id,
        {
          ...parsed.data,
          author: actor.displayName,
          status: "pending",
          rejectionReason: undefined,
        },
        actor,
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Artikel tidak ditemukan" },
      { status: 404 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const current = (await listOwned(actor.id, params.id))[0];
  if (!current)
    return NextResponse.json(
      { error: "Artikel tidak ditemukan" },
      { status: 404 },
    );
  await deleteArticle(params.id);
  return NextResponse.json({ ok: true });
}

async function listOwned(authorId: string, id: string) {
  return (await import("@/lib/db")).listArticlesFromDatabase({ id, authorId });
}

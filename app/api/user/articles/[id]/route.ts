import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteArticle, updateArticle } from "@/lib/db";
import { getActor } from "@/lib/authz";
import { prepareArticleSubmission } from "@/lib/article-analysis";
import { notifyNewArticle } from "@/lib/article-notifications";

const block = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("text"),
    text: z.string().min(1).max(20000),
    html: z.string().max(30000).optional(),
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
  z.object({
    id: z.string().min(1).max(80),
    type: z.enum(["link", "button"]),
    text: z.string().min(1).max(200),
    url: z.string().url().max(2000).refine((url) => url.startsWith("https://"), "URL harus menggunakan HTTPS"),
  }),
  z.object({
    id: z.string().min(1).max(80),
    type: z.literal("callout"),
    title: z.string().max(120).optional(),
    text: z.string().min(1).max(2000),
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
    const { article, status, review } = await prepareArticleSubmission(parsed.data);
    // Artikel yang diturunkan redaksi perlu diperiksa manual sebelum terbit kembali.
    const nextStatus = current.takenDownAt && current.status !== "published" && status === "published"
      ? "pending"
      : status;
    const updated = await updateArticle(
      params.id,
      {
        ...article,
        author: actor.displayName,
        status: nextStatus,
      },
      actor,
    );
    if (updated.status === "published" && current.status !== "published") await notifyNewArticle(updated).catch(() => null);
    return NextResponse.json({
      article: updated,
      aiReview: review,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Artikel gagal diperbarui" },
      { status: 503 },
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

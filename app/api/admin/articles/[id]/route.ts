import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteArticle, updateArticle } from "@/lib/db";
import { getActor, isStaff } from "@/lib/authz";
import { createNotification } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { communityDb } from "@/lib/community";
import { notifyActivity } from "@/lib/activity-notifications";

const patchSchema = z.object({
  title: z.string().min(5).max(180).optional(),
  dek: z.string().min(10).max(500).optional(),
  thumbnailUrl: z.string().url().max(3000).optional(),
  category: z
    .enum(["Ekonomi", "Teknologi", "Politik", "Olahraga", "Budaya"])
    .optional(),
  author: z.string().min(2).max(100).optional(),
  readTime: z.number().int().min(1).max(60).optional(),
  content: z.array(z.string().min(20).max(10000)).min(1).optional(),
  featured: z.boolean().optional(),
  breaking: z.boolean().optional(),
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Data artikel tidak valid" },
      { status: 422 },
    );
  if (actor.role === "superadmin" && !parsed.data.status)
    return NextResponse.json(
      { error: "Superadmin hanya dapat mengubah status approval artikel" },
      { status: 403 },
    );
  const update =
    actor.role === "superadmin"
      ? {
          status: parsed.data.status,
          rejectionReason: parsed.data.rejectionReason,
        }
      : parsed.data;
  try {
    const article = await updateArticle(params.id, update, actor);
    if (parsed.data.status === "published" && article.authorId) {
      const notification = {
        userId: article.authorId,
        title: "Artikel diterbitkan",
        body: `Artikel “${article.title}” sudah diterbitkan di ResponKu.`,
        href: `/artikel/${article.slug}`,
      };
      await createNotification(notification).catch(() => null);
      await sendPushToUser(article.authorId, notification).catch(() => null);
    }
    return NextResponse.json({
      article,
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
  if (!actor || actor.role !== "admin")
    return NextResponse.json(
      { error: "Hanya admin yang dapat menghapus artikel" },
      { status: 403 },
    );
  try {
    const db = await communityDb();
    const article = await db.collection("articles").findOne({ id: params.id });
    if (!article) return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    await deleteArticle(params.id);
    if (article.authorId) await notifyActivity({ userId: String(article.authorId), title: "Artikel dihapus", body: `Artikel “${article.title}” telah dihapus oleh redaksi.`.slice(0, 500), href: "/akun#riwayat" }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Artikel tidak ditemukan" },
      { status: 404 },
    );
  }
}

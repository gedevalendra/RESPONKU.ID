import { revalidatePath } from "next/cache";
import { getPinnedArticleId, setHomepagePin } from "@/lib/homepage-pin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";
import { notifyActivity } from "@/lib/activity-notifications";
import type { Article } from "@/lib/types";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("takedown"), note: z.string().trim().min(1).max(500) }),
  z.object({ action: z.literal("pin"), pinned: z.boolean() }),
  z.object({ action: z.literal("promote"), promoted: z.boolean() }),
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getActor();
  if (!isStaff(actor?.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tindakan tidak valid." }, { status: 422 });
  const action = parsed.data;

  try {
    const db = await communityDb();
    if (action.action === "pin") {
      const published = await db.collection<Article>("articles").findOne(
        { id: params.id, status: "published" },
        { projection: { id: 1 } },
      );
      if (!published) return NextResponse.json({ error: "Hanya artikel yang sedang terbit yang dapat disematkan." }, { status: 409 });

      await setHomepagePin(params.id, action.pinned);
      revalidatePath("/");
      return NextResponse.json({ ok: true, pinnedId: await getPinnedArticleId() });
    }
    const article = await db.collection<Article>("articles").findOneAndUpdate(
      { id: params.id, status: "published" },
      { $set: {
        updatedAt: new Date().toISOString(),
        ...(action.action === "takedown"
          ? { status: "rejected", rejectionReason: action.note, promoted: false, featured: false, takenDownAt: new Date().toISOString() }
          : { promoted: action.promoted }),
      } },
      { returnDocument: "after" },
    );
    if (!article) return NextResponse.json({ error: "Artikel sudah tidak terbit. Muat ulang daftar." }, { status: 409 });

    if (action.action === "takedown") {
      await setHomepagePin(params.id, false).catch((error) => console.error("Gagal melepas sematan artikel", error));
      revalidatePath("/");
    }

    if (action.action === "takedown" && article.authorId) {
      await notifyActivity({
        userId: article.authorId,
        title: "Artikel ditarik oleh redaksi",
        body: action.note,
        href: "/akun#riwayat",
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Perubahan artikel gagal disimpan." }, { status: 503 });
  }
}

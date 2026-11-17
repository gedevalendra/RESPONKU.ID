import { NextResponse } from "next/server";
import { z } from "zod";
import { createComment, listComments, getArticleFromDatabase } from "@/lib/db";
import { notifyActivity } from "@/lib/activity-notifications";
import { getActor } from "@/lib/authz";

const schema = z.object({
  articleSlug: z.string().min(1).max(180),
  body: z.string().trim().min(3).max(2000),
});

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("articleSlug");
  if (!slug)
    return NextResponse.json(
      { error: "articleSlug wajib diisi" },
      { status: 400 },
    );
  try {
    return NextResponse.json({ comments: await listComments(slug) });
  } catch {
    return NextResponse.json(
      { error: "Komentar belum dapat dimuat" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk untuk berkomentar" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Komentar tidak valid",
        issues: parsed.error.flatten(),
      },
      { status: 422 },
    );
  try {
    const article = await getArticleFromDatabase(parsed.data.articleSlug);
    if (!article) return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    const comment = await createComment({ ...parsed.data, displayName: actor.displayName.slice(0, 60) });
    if (comment.status === "published" && article.authorId && article.authorId !== actor.id) {
      await notifyActivity({ userId: article.authorId, title: "Komentar baru pada artikelmu", body: `${actor.displayName} mengomentari “${article.title}”.`.slice(0, 500), href: `/artikel/${article.slug}` }).catch(() => null);
    }
    return NextResponse.json(
      { comment },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Komentar gagal disimpan. Isi env Supabase terlebih dahulu." },
      { status: 503 },
    );
  }
}

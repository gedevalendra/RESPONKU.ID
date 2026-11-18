import { NextResponse } from "next/server";
import { z } from "zod";
import { createComment, listComments, getArticleFromDatabase } from "@/lib/db";
import { notifyActivity } from "@/lib/activity-notifications";
import { getActor } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  articleSlug: z.string().min(1).max(180),
  body: z.string().trim().min(3).max(2000),
  parentId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("articleSlug");
  if (!slug)
    return NextResponse.json(
      { error: "articleSlug wajib diisi" },
      { status: 400 },
    );
  try {
    const visitorId = new URL(request.url).searchParams.get("visitorId");
    return NextResponse.json(
      { comments: await listComments(slug, visitorId && visitorId.length <= 120 ? visitorId : undefined) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Gagal memuat komentar", error);
    return NextResponse.json(
      { error: "Komentar belum dapat dimuat dari database" },
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
    if (parsed.data.parentId) {
      const { data: parent, error: parentError } = await getSupabaseAdmin()!
        .from("comments")
        .select("id,article_slug,status")
        .eq("id", parsed.data.parentId)
        .eq("article_slug", parsed.data.articleSlug)
        .eq("status", "published")
        .maybeSingle();
      if (parentError || !parent) return NextResponse.json({ error: "Komentar yang dibalas tidak ditemukan" }, { status: 422 });
    }
    const comment = await createComment({
      ...parsed.data,
      oauthAuthorId: actor.provider && actor.provider !== "supabase" ? actor.id : undefined,
      authorId: !actor.provider ? actor.id : undefined,
      displayName: actor.displayName.slice(0, 60),
    });
    if (comment.status === "published" && article.authorId && article.authorId !== actor.id) {
      await notifyActivity({ userId: article.authorId, title: "Komentar baru pada artikelmu", body: `${actor.displayName} mengomentari “${article.title}”.`.slice(0, 500), href: `/artikel/${article.slug}` }).catch(() => null);
    }
    return NextResponse.json(
      { comment },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menyimpan komentar", error);
    return NextResponse.json(
      { error: "Komentar gagal disimpan ke database" },
      { status: 503 },
    );
  }
}

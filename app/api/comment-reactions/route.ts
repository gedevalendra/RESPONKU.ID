import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({ commentId: z.string().uuid(), visitorId: z.string().min(8).max(120), reaction: z.enum(["like", "dislike"]) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Reaksi komentar tidak valid" }, { status: 422 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const { commentId, visitorId, reaction } = parsed.data;
  const failure = (error: { code: string }) => {
    console.error("Gagal memproses reaksi komentar", error.code);
    return NextResponse.json({ error: "Reaksi belum dapat diproses. Coba lagi." }, { status: 503 });
  };
  const { data: existing, error: readError } = await db.from("comment_reactions")
    .select("reaction").eq("comment_id", commentId).eq("visitor_id", visitorId).maybeSingle();
  if (readError) return failure(readError);

  const nextReaction = existing?.reaction === reaction ? null : reaction;
  const { error: writeError } = nextReaction
    ? await db.from("comment_reactions").upsert(
        { comment_id: commentId, visitor_id: visitorId, reaction: nextReaction },
        { onConflict: "comment_id,visitor_id" },
      )
    : await db.from("comment_reactions").delete().eq("comment_id", commentId).eq("visitor_id", visitorId);
  if (writeError) return failure(writeError);

  const [likes, dislikes] = await Promise.all(
    (["like", "dislike"] as const).map((value) =>
      db.from("comment_reactions").select("id", { count: "exact", head: true })
        .eq("comment_id", commentId).eq("reaction", value),
    ),
  );
  const countError = likes.error || dislikes.error;
  if (countError) return failure(countError);
  return NextResponse.json({ likes: likes.count, dislikes: dislikes.count, reaction: nextReaction });
}

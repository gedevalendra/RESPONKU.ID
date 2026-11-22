import { NextResponse } from "next/server";
import { z } from "zod";
import { addReaction, getReactionSummary } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getActor } from "@/lib/authz";
import { cookies } from "next/headers";

const schema = z.object({
  articleSlug: z.string().min(1),
  reaction: z.enum(["like", "insightful", "celebrate"]),
  visitorId: z.string().min(8).max(100),
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
    const actor = await getActor();
    const db = getSupabaseAdmin();
    
    const visitorIds = [visitorId].filter(Boolean) as string[];
    if (actor?.id && !visitorIds.includes(actor.id)) visitorIds.push(actor.id);
    const cookieId = cookies().get("responku_visitor_id")?.value;
    if (cookieId && !visitorIds.includes(cookieId)) visitorIds.push(cookieId);

    const [summary, viewer] = await Promise.all([
      getReactionSummary(slug),
      db && visitorIds.length
        ? db.from("article_reactions").select("reaction")
            .eq("article_slug", slug).in("visitor_id", visitorIds).maybeSingle()
        : null,
    ]);
    return NextResponse.json(
      { ...summary, viewerReaction: viewer?.data?.reaction ?? null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ like: 0, insightful: 0, celebrate: 0 });
  }
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Reaksi tidak valid" }, { status: 422 });
  
  try {
    const actor = await getActor();
    const { articleSlug, reaction, visitorId } = parsed.data;
    
    // Simpan visitorId ke cookie agar server bisa mengenalinya di halaman profil
    cookies().set("responku_visitor_id", visitorId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 tahun
      httpOnly: true,
      sameSite: "lax",
    });

    // Jika login, kita bisa mencatat reaksi untuk ID akun juga agar sinkron antar perangkat
    if (actor?.id) {
      await addReaction(articleSlug, reaction, actor.id);
    }

    return NextResponse.json(
      await addReaction(articleSlug, reaction, visitorId),
    );
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Reaksi gagal disimpan" },
      { status: 503 },
    );
  }
}

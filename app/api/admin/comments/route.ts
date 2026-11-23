import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getArticleFromDatabase } from "@/lib/db";
import { notifyActivity } from "@/lib/activity-notifications";

export async function GET() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database belum tersedia" }, { status: 503 });
  const { data, error } = await db.from("comments").select("id,article_slug,display_name,body,status,created_at").order("created_at", { ascending: false }).limit(500);
  return error ? NextResponse.json({ error: "Komentar gagal dimuat" }, { status: 503 }) : NextResponse.json({ comments: data });
}

export async function DELETE() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database belum tersedia" }, { status: 503 });
  const { error, count } = await db.from("comments").delete({ count: "exact" }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: "Komentar gagal dihapus" }, { status: 503 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["published", "rejected", "pending"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 422 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database belum tersedia" }, { status: 503 });
  const { data: previous, error: readError } = await db.from("comments").select("id,status,article_slug,display_name").eq("id", parsed.data.id).maybeSingle();
  if (readError || !previous) return NextResponse.json({ error: "Komentar tidak ditemukan" }, { status: 404 });
  const { data: updated, error } = await db.from("comments").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", parsed.data.id).eq("status", previous.status).select("id");
  if (!error && updated?.length && parsed.data.status === "published" && previous.status !== "published") {
    const article = await getArticleFromDatabase(previous.article_slug);
    if (article?.authorId) await notifyActivity({ userId: article.authorId, title: "Komentar baru pada artikelmu", body: `${previous.display_name} mengomentari “${article.title}”.`.slice(0, 500), href: `/artikel/${article.slug}` }).catch(() => null);
  }
  return error ? NextResponse.json({ error: "Moderasi gagal disimpan" }, { status: 503 }) : NextResponse.json({ ok: true });
}

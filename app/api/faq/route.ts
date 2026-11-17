import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";
import { notifyActivity } from "@/lib/activity-notifications";

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  try {
    const db = await communityDb();
    const questions = await db.collection("faq_questions").find(isStaff(actor.role) ? {} : { userId: actor.id }).sort({ createdAt: -1 }).limit(200).toArray();
    return NextResponse.json({ questions });
  } catch { return NextResponse.json({ error: "Pertanyaan gagal dimuat" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk untuk mengirim pertanyaan" }, { status: 401 });
  const parsed = z.object({ question: z.string().trim().min(10).max(2000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pertanyaan harus 10–2000 karakter" }, { status: 422 });
  try {
    const db = await communityDb();
    const recent = await db.collection("faq_questions").countDocuments({ userId: actor.id, createdAt: { $gte: new Date(Date.now() - 3600000).toISOString() } });
    if (recent >= 5) return NextResponse.json({ error: "Maksimal 5 pertanyaan per jam. Coba lagi nanti." }, { status: 429 });
    await db.collection("faq_questions").insertOne({ id: crypto.randomUUID(), userId: actor.id, displayName: actor.displayName, question: parsed.data.question, status: "pending", createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Pertanyaan gagal dikirim" }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["approved", "answered", "rejected"]), answer: z.string().trim().max(500).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.status === "answered" && !parsed.data.answer)) return NextResponse.json({ error: "Jawaban wajib diisi, maksimal 500 karakter" }, { status: 422 });
  try {
    const db = await communityDb();
    const question = await db.collection("faq_questions").findOne({ id: parsed.data.id });
    if (!question) return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
    if (parsed.data.status === "answered" && !["approved", "answered"].includes(question.status)) return NextResponse.json({ error: "Setujui pertanyaan sebelum menjawab" }, { status: 409 });
    await db.collection("faq_questions").updateOne({ id: parsed.data.id }, { $set: { status: parsed.data.status, ...(parsed.data.answer ? { answer: parsed.data.answer } : {}), reviewedBy: actor.id, updatedAt: new Date().toISOString() } });
    if (parsed.data.status === "answered") await notifyActivity({ userId: String(question.userId), title: "Jawaban pertanyaanmu", body: parsed.data.answer!, href: "/faq#pertanyaan-saya" });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Perubahan atau pengiriman notifikasi gagal. Coba lagi." }, { status: 503 }); }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";
export async function GET() {
  try { const db = await communityDb(); const value = await db.collection("site_settings").findOne({ key: "welcome_popup" }); return NextResponse.json({ popup: value?.value || null }); }
  catch { return NextResponse.json({ popup: null }); }
}
export async function PUT(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = z.object({ enabled: z.boolean(), title: z.string().max(150), text: z.string().max(5000), buttonLabel: z.string().trim().max(50).optional(), buttonAlignment: z.enum(["left", "center", "right"]).optional(), image: z.union([z.literal(""), z.string().url()]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data popup tidak valid" }, { status: 422 });
  try { const db = await communityDb(); await db.collection("site_settings").updateOne({ key: "welcome_popup" }, { $set: { value: { ...parsed.data, version: crypto.randomUUID() } } }, { upsert: true }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Popup gagal disimpan" }, { status: 503 }); }
}

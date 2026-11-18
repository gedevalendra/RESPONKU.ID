import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";

export const dynamic = "force-dynamic";

const settingsKey = "welcome_popup";
const headers = { "Cache-Control": "no-store" };
const popupSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(150),
  text: z.string().max(5000),
  buttonLabel: z.string().trim().max(50).optional(),
  buttonAlignment: z.enum(["left", "center", "right"]).optional(),
  buttonWidth: z.union([z.literal("full"), z.number().int().min(48).max(400)]).optional(),
  buttonHeight: z.number().int().min(40).max(88).optional(),
  buttonRadius: z.number().int().min(0).max(48).optional(),
  buttonColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  buttonTextColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  image: z.union([z.literal(""), z.string().url()]).default(""),
});

export async function GET() {
  try {
    const db = await communityDb();
    const setting = await db.collection("site_settings").findOne({ key: settingsKey });
    return NextResponse.json({ popup: setting?.value ?? null }, { headers });
  } catch (error) {
    console.error("Gagal membaca pengaturan popup", error);
    return NextResponse.json({ error: "Pengaturan popup gagal dimuat." }, { headers, status: 503 });
  }
}

export async function PUT(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) {
    return NextResponse.json({ error: "Hanya admin yang dapat mengubah popup." }, { status: 403 });
  }

  const parsed = popupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data popup tidak valid. Periksa teks, gambar, dan ukuran tombol." }, { status: 422 });
  }

  try {
    const db = await communityDb();
    const popup = { ...parsed.data, version: crypto.randomUUID() };
    await db.collection("site_settings").updateOne(
      { key: settingsKey },
      { $set: { value: popup } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, popup });
  } catch (error) {
    console.error("Gagal menyimpan pengaturan popup", error);
    return NextResponse.json({ error: "Popup gagal disimpan ke database." }, { status: 503 });
  }
}

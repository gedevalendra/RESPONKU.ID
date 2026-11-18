import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { homepageAdSchema, homepageAdSlotSchema, saveHomepageAd } from "@/lib/homepage-ad";

export async function PUT(request: Request) {
  if (!isStaff((await getActor())?.role)) {
    return NextResponse.json({ error: "Khusus admin." }, { status: 403 });
  }

  const slot = homepageAdSlotSchema.safeParse(new URL(request.url).searchParams.get("slot") ?? "hot");
  if (!slot.success) return NextResponse.json({ error: "Slot iklan tidak valid." }, { status: 422 });

  const parsed = homepageAdSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Lengkapi judul, URL gambar HTTPS, dan tautan tujuan HTTPS untuk mengaktifkan iklan." }, { status: 422 });
  }

  try {
    await saveHomepageAd(parsed.data, slot.data);
    revalidatePath("/");
    return NextResponse.json({ ad: parsed.data });
  } catch {
    return NextResponse.json({ error: "Iklan gagal disimpan." }, { status: 503 });
  }
}

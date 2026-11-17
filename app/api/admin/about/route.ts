import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { getAboutPage, saveAboutPage } from "@/lib/db";

const item = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  text: z.string().min(1).max(3000),
});
const section = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(["text", "highlight", "cards", "list"]),
  eyebrow: z.string().max(100),
  title: z.string().min(1).max(240),
  paragraphs: z.array(z.string().max(10000)).max(12),
  items: z.array(item).max(12).optional(),
  listItems: z.array(z.string().max(3000)).max(30).optional(),
});
const page = z.object({
  title: z.string().min(1).max(300),
  intro: z.string().min(1).max(1000),
  sidebarTitle: z.string().min(1).max(300),
  sidebarText: z.string().min(1).max(1000),
  sections: z.array(section).max(30),
});

export async function GET() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  return NextResponse.json(await getAboutPage());
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = page.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Format halaman Tentang tidak valid" },
      { status: 422 },
    );
  try {
    return NextResponse.json(await saveAboutPage(parsed.data));
  } catch {
    return NextResponse.json(
      { error: "Halaman Tentang gagal disimpan. Pastikan MongoDB tersambung." },
      { status: 503 },
    );
  }
}

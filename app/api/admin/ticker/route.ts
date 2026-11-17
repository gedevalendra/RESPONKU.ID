import { NextResponse } from "next/server";
import { z } from "zod";
import { getManualTickerHeadlines, saveManualTickerHeadlines } from "@/lib/db";
import { getActor, isStaff } from "@/lib/authz";

const input = z.object({
  headlines: z.array(z.string().trim().min(2).max(240)).max(12),
});

export async function GET() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  return NextResponse.json({ headlines: await getManualTickerHeadlines() });
}

export async function PUT(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Maksimal 12 teks ticker, masing-masing 2–240 karakter." }, { status: 422 });
  try {
    return NextResponse.json({ headlines: await saveManualTickerHeadlines(parsed.data.headlines) });
  } catch {
    return NextResponse.json({ error: "Ticker gagal disimpan" }, { status: 503 });
  }
}

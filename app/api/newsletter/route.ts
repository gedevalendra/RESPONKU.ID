import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid" }, { status: 422 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const { error } = await supabase.from("newsletter_subscribers").upsert({ email: parsed.data.email.toLowerCase(), status: "active" }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: "Pendaftaran newsletter gagal" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

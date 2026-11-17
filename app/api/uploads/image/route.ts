import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.type !== "image/webp") return NextResponse.json({ error: "Foto harus berupa WebP hasil konversi" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran foto maksimal 2 MB" }, { status: 413 });
  const kind = form.get("kind") === "avatar" ? "avatars" : "articles";
  const path = `${kind}/${actor.id}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(env.supabaseStorageBucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Foto gagal disimpan. Pastikan bucket Storage sudah dibuat." }, { status: 503 });
  const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, size: file.size, type: "image/webp" }, { status: 201 });
}

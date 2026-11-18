import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { updateOAuthAvatar, updateOAuthBackground } from "@/lib/db";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu" },
      { status: 401 },
    );
  const supabase = getSupabaseAdmin();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi" },
      { status: 503 },
    );
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.type !== "image/webp")
    return NextResponse.json(
      { error: "Foto harus berupa WebP hasil konversi" },
      { status: 422 },
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: "Ukuran foto maksimal 2 MB" },
      { status: 413 },
    );
  const requestedKind = form.get("kind");
  const kind = requestedKind === "avatar" ? "avatars" : requestedKind === "background" ? "backgrounds" : "articles";
  const path = `${kind}/${actor.id}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error)
    return NextResponse.json(
      { error: "Foto gagal disimpan. Pastikan bucket Storage sudah dibuat." },
      { status: 503 },
    );
  // Simpan URL langsung dari Supabase, bukan URL relatif ke server aplikasi.
  // URL relatif dapat menunjuk ke localhost atau host proxy yang berbeda saat
  // aplikasi dijalankan di production.
  const { data: publicUrlData } = supabase.storage
    .from(env.supabaseStorageBucket)
    .getPublicUrl(path);
  const avatarUrl = publicUrlData.publicUrl;
  const publicImage = await fetch(avatarUrl, { method: "HEAD", cache: "no-store" }).catch(() => null);
  if (!publicImage?.ok || !publicImage.headers.get("content-type")?.startsWith("image/")) {
    await supabase.storage.from(env.supabaseStorageBucket).remove([path]);
    return NextResponse.json(
      { error: "URL foto tidak dapat diakses. Periksa akses publik bucket Storage." },
      { status: 503 },
    );
  }
  if (kind === "avatars" || kind === "backgrounds") {
    try {
      if (actor.provider) {
        if (kind === "avatars") await updateOAuthAvatar(actor.id, avatarUrl);
        else await updateOAuthBackground(actor.id, avatarUrl);
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            ...(kind === "avatars" ? { avatar_url: avatarUrl } : { background_url: avatarUrl }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", actor.id)
          .select("id")
          .single();
        if (profileError) throw profileError;
      }
    } catch {
      return NextResponse.json(
        { error: "Foto tersimpan, tetapi profil gagal disinkronkan." },
        { status: 503 },
      );
    }
  }
  return NextResponse.json(
    { url: avatarUrl, size: file.size, type: "image/webp", kind: requestedKind },
    { status: 201 },
  );
}

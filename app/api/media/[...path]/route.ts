import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase || params.path.length === 0)
    return new NextResponse("Media tidak tersedia", { status: 404 });

  const path = params.path.map((part) => decodeURIComponent(part)).join("/");
  const { data, error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .download(path);
  if (error || !data)
    return new NextResponse("Media tidak ditemukan", { status: 404 });

  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

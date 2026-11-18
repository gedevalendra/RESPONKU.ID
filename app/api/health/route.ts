import { NextResponse } from "next/server";
import { env, hasGroq, hasMongo, hasSupabase } from "@/lib/env";
export function GET() {
  return NextResponse.json({
    ok: true,
    services: {
      supabase: hasSupabase,
      mongodb: hasMongo,
      groq: hasGroq,
    },
    // Hanya nama model yang aman ditampilkan; API key tidak pernah dikirim.
    groqModel: env.groqModel || null,
  });
}

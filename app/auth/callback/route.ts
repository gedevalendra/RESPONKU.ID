import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const response = NextResponse.redirect(new URL(next, request.url));
  if (code) {
    if (!env.supabaseUrl || !env.supabasePublicKey) return NextResponse.redirect(new URL("/masuk?error=Supabase%20belum%20dikonfigurasi", request.url));
    const cookieStore = cookies();
    const supabase = createServerClient(env.supabaseUrl, env.supabasePublicKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/masuk?error=${encodeURIComponent(error.message)}`, request.url));
  }
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const bypass = pathname.startsWith("/api") || pathname.startsWith("/admin") || pathname.startsWith("/superadmin") || pathname.startsWith("/masuk") || pathname.startsWith("/_next") || pathname.startsWith("/auth")|| pathname === "/status-website";
  if (!bypass) {
    try {
      const statusResponse = await fetch(new URL("/api/public/website-status", request.url).toString(), { cache: "no-store" });
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        const status = data.status?.status;
        if (status && status !== "online") {
          return NextResponse.rewrite(new URL("/status-website", request.url));
        }
      }
    } catch {}
  }
  const url = env.supabaseUrl;
  const key = env.supabasePublicKey;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt$|(?:news-)?sitemap\\.xml$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

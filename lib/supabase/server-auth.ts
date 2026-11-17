import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export function getSupabaseAuthServer() {
  const cookieStore = cookies();
  return createServerClient(
    env.supabaseUrl!,
    env.supabasePublicKey!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot write cookies. */ }
        },
      },
    },
  );
}

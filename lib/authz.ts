import "server-only";
import { getSupabaseAuthServer } from "@/lib/supabase/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import { env } from "@/lib/env";
import { getOAuthActor } from "@/lib/oauth";
import { roleForEmail } from "@/lib/roles";
import { communityDb } from "@/lib/community";

export async function getActor(): Promise<Profile | null> {
  const oauthActor = await getOAuthActor();
  if (oauthActor) {
    const override = await (await communityDb()).collection("account_roles").findOne({ userId: oauthActor.id });
    return { ...oauthActor, role: (override?.role || oauthActor.role) as UserRole };
  }
  if (!env.supabaseUrl || !env.supabasePublicKey) return null;
  const authClient = getSupabaseAuthServer();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", user.id)
    .single();
  const email = user.email || data?.email || "";
  const override = await (await communityDb()).collection("account_roles").findOne({ userId: user.id });
  return {
    id: user.id,
    email,
    displayName: data?.display_name || user.email?.split("@")[0] || "Pembaca",
    role:
      override?.role ? override.role as UserRole : roleForEmail(email) === "superadmin"
        ? "superadmin"
        : ((data?.role || "reader") as UserRole),
  };
}

export function isStaff(role?: UserRole | null): boolean {
  return role === "admin" || role === "superadmin";
}
export function isSuperAdmin(role?: UserRole | null): boolean {
  return role === "superadmin";
}

import "server-only";
import { communityDb } from "@/lib/community";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { roleForEmail } from "@/lib/roles";

export async function findManagedUser(id: string) {
  const db = await communityDb();
  const override = await db.collection("account_roles").findOne({ userId: id });
  const oauth = await db.collection("oauth_users").findOne({ id });
  if (oauth) return { id, email: String(oauth.email), name: String(oauth.displayName), role: override?.role || (roleForEmail(String(oauth.email)) === "superadmin" ? "superadmin" : String(oauth.role)), source: "oauth" };
  const admin = getSupabaseAdmin();
  const result = await admin?.from("profiles").select("id,email,display_name,role").eq("id", id).maybeSingle();
  if (result?.error) throw result.error;
  const row = result?.data;
  return row ? { id, email: String(row.email), name: String(row.display_name), role: override?.role || (roleForEmail(String(row.email)) === "superadmin" ? "superadmin" : String(row.role)), source: "supabase" } : null;
}

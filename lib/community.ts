import "server-only";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function communityDb() {
  const db = await getMongoDb();
  if (!db) throw new Error("Database belum tersambung");
  return db;
}

export async function publicProfile(id: string) {
  const db = await communityDb();
  const oauth = await db.collection("oauth_users").findOne({ $or: [{ id }, { username: id }] });
  let profile = oauth ? {
    id: String(oauth.id), displayName: String(oauth.displayName),
    username: String(oauth.username || ""), avatarUrl: String(oauth.avatarUrl || ""),
    backgroundUrl: String(oauth.backgroundUrl || ""),
    bio: String(oauth.bio || ""),
  } : null;
  if (!profile) {
    const admin = getSupabaseAdmin();
    const column = /^[0-9a-f-]{36}$/i.test(id) ? "id" : "username";
    const result = await admin?.from("profiles").select("id,display_name,username,avatar_url,background_url,bio").eq(column, id).maybeSingle();
    const row = result?.data;
    if (row) profile = { id: row.id, displayName: row.display_name, username: row.username || "", avatarUrl: row.avatar_url || "", backgroundUrl: row.background_url || "", bio: row.bio || "" };
  }
  if (!profile) return null;
  const badge = await db.collection("profile_badges").findOne({ userId: profile.id });
  const membership = await db.collection("organization_members").findOne({ userId: profile.id, status: "approved" });
  const organization = membership ? await db.collection("organizations").findOne({ id: membership.organizationId, verified: true }) : null;
  return { ...profile, verified: Boolean(badge?.verified), organization: organization?.name || "" };
}

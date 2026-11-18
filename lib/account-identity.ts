import "server-only";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function findVerifiedPasswordProfile(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data: profile, error } = await admin.from("profiles")
    .select("id,email,display_name,role").eq("email", email).maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const { data, error: authError } = await admin.auth.admin.getUserById(profile.id);
  if (authError) throw authError;
  const user = data.user;
  return user?.email_confirmed_at && user.email?.trim().toLowerCase() === email ? profile : null;
}

export async function connectOAuthProfiles(email: string, accountId: string) {
  const db = await getMongoDb();
  await db?.collection("oauth_users").updateMany(
    {
      $or: [
        { verifiedEmail: email, id: { $ne: accountId }, accountId: { $ne: accountId } },
        { accountId, verifiedEmail: { $ne: email } },
        { id: accountId, accountId: { $exists: true } },
      ],
    },
    [{ $set: { accountId: {
      $cond: [
        { $and: [{ $eq: ["$verifiedEmail", email] }, { $ne: ["$id", accountId] }] },
        accountId,
        "$$REMOVE",
      ],
    } } }],
  );
}

export async function linkedAccountIds(id: string): Promise<string[]> {
  const db = await getMongoDb();
  if (!db) return [id];
  const aliases = await db.collection("oauth_users").distinct("id", { accountId: id });
  return [id, ...aliases.filter((alias): alias is string => typeof alias === "string")];
}

export async function linkedOAuthProviders(id: string): Promise<string[]> {
  const db = await getMongoDb();
  if (!db) return [];
  const accounts = await db.collection<{ provider?: string }>("oauth_users")
    .find({ $or: [{ id }, { accountId: id }] }, { projection: { provider: 1 } })
    .toArray();
  return [...new Set(accounts.map((account) => account.provider).filter((provider): provider is string => Boolean(provider)))];
}

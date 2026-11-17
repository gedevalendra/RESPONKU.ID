import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";
import { roleForEmail } from "@/lib/roles";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listOAuthUsers } from "@/lib/db";

export async function GET() {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  const supabase = getSupabaseAdmin();
  let profiles: Array<Record<string, unknown>> = [];
  if (supabase) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,role,created_at")
        .order("id")
        .range(offset, offset + 499);
      if (error)
        return NextResponse.json({ error: "User gagal dimuat" }, { status: 503 });
      profiles.push(...(data || []));
      if (!data || data.length < 500) break;
    }
  }
  const oauthUsers = await listOAuthUsers();
  const db = await communityDb();
  const overrides = await db.collection("account_roles").find({}).toArray();
  const badges = await db.collection("profile_badges").find({}).toArray();
  const members = await db.collection("organization_members").find({ status: "approved" }).toArray();
  const organizations = await db.collection("organizations").find({ verified: true }).toArray();
  return NextResponse.json({
    actorId: actor.id,
    actorRole: actor.role,
    organizations: organizations.map((org) => ({ id: org.id, name: org.name })),
    users: [
      ...profiles.map((user) => ({ id: String(user.id), email: String(user.email), display_name: String(user.display_name), role: String(user.role), created_at: user.created_at, source: "supabase" })),
      ...oauthUsers.map((user) => ({
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        role: user.role,
        created_at: user.createdAt,
        source: "oauth",
      })),
    ].map((user) => ({
      ...user,
      role: overrides.find((override) => override.userId === user.id)?.role || (roleForEmail(String(user.email)) === "superadmin" ? "superadmin" : user.role),
      verified: badges.some((badge) => badge.userId === user.id && badge.verified),
      organizationId: members.find((member) => member.userId === user.id)?.organizationId || "",
    })),
  });
}

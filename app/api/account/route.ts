import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getActor } from "@/lib/authz";
import { communityDb } from "@/lib/community";
import { getSupabaseAdmin } from "@/lib/supabase/server";
export async function DELETE(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const data = await request.json().catch(() => null);
  if (data?.confirmation !== actor.displayName) return NextResponse.json({ error: "Nama akun tidak sesuai" }, { status: 422 });
  try {
    const db = await communityDb();
    if (await db.collection("organizations").findOne({ ownerId: actor.id })) return NextResponse.json({ error: "Alihkan kepemilikan organisasi melalui admin sebelum menghapus akun." }, { status: 409 });
    if (actor.provider) await db.collection("oauth_users").deleteOne({ id: actor.id });
    else {
      const admin = getSupabaseAdmin();
      if (!admin) throw new Error();
      const result = await admin.auth.admin.deleteUser(actor.id);
      if (result.error) throw result.error;
    }
    await db.collection("organization_members").deleteMany({ userId: actor.id });
    await db.collection("push_subscriptions").deleteMany({ userId: actor.id });
    await db.collection("profile_badges").deleteMany({ userId: actor.id });
    const admin = getSupabaseAdmin();
    await admin?.from("notifications").delete().eq("user_id", actor.id);
    cookies().delete("responku_oauth_session");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Akun gagal dihapus" }, { status: 503 }); }
}

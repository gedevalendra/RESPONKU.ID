import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { linkedAccountIds } from "@/lib/account-identity";
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
    const ids = await linkedAccountIds(actor.id);
    if (actor.linkedOAuth && ids.length > 1) return NextResponse.json({ error: "Masuk dengan sandi untuk menghapus akun yang terhubung." }, { status: 409 });
    if (await db.collection("organizations").findOne({ ownerId: { $in: ids } })) return NextResponse.json({ error: "Alihkan kepemilikan organisasi melalui admin sebelum menghapus akun." }, { status: 409 });
    if (!actor.provider) {
      const admin = getSupabaseAdmin();
      if (!admin) throw new Error();
      const result = await admin.auth.admin.deleteUser(actor.id);
      if (result.error) throw result.error;
    }
    await db.collection("oauth_users").deleteMany({ id: { $in: ids } });
    await db.collection("organization_members").deleteMany({ userId: { $in: ids } });
    await db.collection("push_subscriptions").deleteMany({ userId: { $in: ids } });
    await db.collection("profile_badges").deleteMany({ userId: { $in: ids } });
    const admin = getSupabaseAdmin();
    await admin?.from("notifications").delete().in("user_id", ids);
    cookies().delete("responku_oauth_session");
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Akun gagal dihapus" }, { status: 503 }); }
}

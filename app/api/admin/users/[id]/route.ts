import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor, isStaff, isSuperAdmin } from "@/lib/authz";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { communityDb } from "@/lib/community";
import { findManagedUser } from "@/lib/admin-users";

const schema = z.object({
  role: z.enum(["reader", "author", "admin", "superadmin"]).optional(),
  verified: z.boolean().optional(),
  organizationId: z.string().max(150).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 422 });
  try {
    const target = await findManagedUser(params.id);
    if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    if (target.role === "superadmin" || parsed.data.role === "superadmin") return NextResponse.json({ error: "Akun superadmin dilindungi" }, { status: 403 });
    if (actor.id === target.id && parsed.data.role) return NextResponse.json({ error: "Tidak dapat mengubah peran sendiri" }, { status: 409 });
    if (!isSuperAdmin(actor.role) && target.role === "admin" && parsed.data.role && parsed.data.role !== "admin") return NextResponse.json({ error: "Hanya superadmin dapat menurunkan peran admin" }, { status: 403 });
    const db = await communityDb();
    const patch = parsed.data;
    if (patch.organizationId) {
      const org = await db.collection("organizations").findOne({ id: patch.organizationId, verified: true });
      if (!org) return NextResponse.json({ error: "Pilih organisasi yang telah diverifikasi" }, { status: 422 });
    }
    if (patch.role) {
      if (target.source === "oauth") await db.collection("oauth_users").updateOne({ id: target.id }, { $set: { role: patch.role } });
      else {
        const admin = getSupabaseAdmin();
        if (!admin) throw new Error();
        const result = await admin.from("profiles").update({ role: patch.role }).eq("id", target.id);
        if (result.error) throw result.error;
      }
    }
    if (patch.verified !== undefined) await db.collection("profile_badges").updateOne({ userId: target.id }, { $set: { verified: patch.verified } }, { upsert: true });
    if (patch.organizationId !== undefined) {
      await db.collection("organization_members").deleteMany({ userId: target.id });
      if (patch.organizationId) await db.collection("organization_members").insertOne({ userId: target.id, organizationId: patch.organizationId, displayName: target.name, status: "approved", approvedBy: actor.id });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Perubahan pengguna gagal disimpan" }, { status: 503 }); }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  try {
    const target = await findManagedUser(params.id);
    if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    if (target.id === actor.id || target.role === "superadmin" || (target.role === "admin" && !isSuperAdmin(actor.role))) return NextResponse.json({ error: "Akun ini dilindungi dari penghapusan" }, { status: 403 });
    const data = await request.json().catch(() => null);
    if (data?.confirmation !== target.name) return NextResponse.json({ error: "Nama konfirmasi tidak sesuai" }, { status: 422 });
    const db = await communityDb();
    if (await db.collection("organizations").findOne({ ownerId: target.id })) return NextResponse.json({ error: "Alihkan kepemilikan organisasi terlebih dahulu" }, { status: 409 });
    const admin = getSupabaseAdmin();
    if (target.source === "oauth") await db.collection("oauth_users").deleteOne({ id: target.id });
    else {
      if (!admin) throw new Error();
      const result = await admin.auth.admin.deleteUser(target.id);
      if (result.error) throw result.error;
    }
    await Promise.all([db.collection("organization_members").deleteMany({ userId: target.id }), db.collection("profile_badges").deleteMany({ userId: target.id }), db.collection("push_subscriptions").deleteMany({ userId: target.id })]);
    await admin?.from("notifications").delete().eq("user_id", target.id);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Penghapusan gagal" }, { status: 503 }); }
}

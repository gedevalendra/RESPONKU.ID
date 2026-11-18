import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { communityDb } from "@/lib/community";
import { z } from "zod";
import { linkedAccountIds } from "@/lib/account-identity";
import { findManagedUser } from "@/lib/admin-users";

export async function GET(request: Request) {
  try {
    const db = await communityDb();
    const actor = await getActor();
    const q = (new URL(request.url).searchParams.get("q") || "").slice(0, 100).toLowerCase();
    const all = await db.collection("organizations").find({}).toArray();
    const accountIds = actor ? await linkedAccountIds(actor.id) : [];
    const organizations = all.filter((org) => isStaff(actor?.role) || org.verified || accountIds.includes(org.ownerId))
      .filter((org) => String(org.name).toLowerCase().includes(q));
    const ownedOrganizationIds = all.filter((org) => accountIds.includes(org.ownerId)).map((org) => org.id);
    const managedOrganizationIds = all.filter((org) => org.verified && (isStaff(actor?.role) || accountIds.includes(org.ownerId))).map((org) => org.id);
    const members = actor ? await db.collection("organization_members")
      .find({ $or: [{ userId: { $in: accountIds } }, { organizationId: { $in: managedOrganizationIds } }] }).toArray() : [];
    const memberships = members.filter((member) => accountIds.includes(member.userId))
      .map(({ organizationId, status }) => ({ organizationId, status }));
    return NextResponse.json({ organizations, members, memberships, ownedOrganizationIds, managedOrganizationIds });
  } catch { return NextResponse.json({ error: "Organisasi gagal dimuat" }, { status: 503 }); }
}

const input = z.object({
  action: z.enum(["create", "join", "reviewOrganization", "reviewMember", "badge"]),
  id: z.string().max(150).optional(), name: z.string().trim().min(2).max(150).optional(),
  ownerId: z.string().max(150).optional(), approved: z.boolean().optional(),
  userId: z.string().max(150).optional(),
  photoUrl: z.string().url().max(3000).optional(),
  description: z.string().trim().max(500).optional(),
  website: z.string().url().max(2000).refine((url) => /^https?:\/\//i.test(url), "Website harus HTTP atau HTTPS").optional(),
});

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Silakan masuk" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 422 });
  const value = parsed.data;
  try {
    const db = await communityDb();
    if (value.ownerId && isStaff(actor.role) && !(await findManagedUser(value.ownerId)))
      return NextResponse.json({ error: "Pilih pemilik dari pengguna yang terdaftar" }, { status: 422 });
    if (value.action === "badge" && value.userId && !(await findManagedUser(value.userId)))
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    if (value.action === "create" && value.name) {
      const organization = {
        id: crypto.randomUUID(),
        name: value.name,
        photoUrl: value.photoUrl || "",
        description: value.description || "",
        website: value.website || "",
        ownerId: isStaff(actor.role) && value.ownerId ? value.ownerId : actor.id,
        verified: isStaff(actor.role),
        createdAt: new Date().toISOString(),
      };
      await db.collection("organizations").insertOne(organization);
      if (organization.verified) await db.collection("organization_members").updateOne({ userId: organization.ownerId, organizationId: organization.id }, { $set: { displayName: actor.displayName, status: "approved" } }, { upsert: true });
    } else if (value.action === "join" && value.id) {
      const org = await db.collection("organizations").findOne({ id: value.id, verified: true });
      if (!org) return NextResponse.json({ error: "Organisasi belum diverifikasi" }, { status: 422 });
      const accountIds = await linkedAccountIds(actor.id);
      const members = db.collection("organization_members");
      if (accountIds.includes(org.ownerId) || await members.findOne({
        organizationId: value.id,
        userId: { $in: accountIds },
        status: { $in: ["approved", "pending"] },
      })) return NextResponse.json({ ok: true });

      await members.updateOne(
        { userId: actor.id, organizationId: value.id },
        [{ $set: {
          status: { $cond: [{ $in: ["$status", ["approved", "pending"]] }, "$status", "pending"] },
          displayName: { $ifNull: ["$displayName", { $literal: actor.displayName }] },
        } }],
        { upsert: true },
      );
    } else if (value.action === "reviewMember" && value.id && value.userId) {
      const org = await db.collection("organizations").findOne({ id: value.id, verified: true });
      if (!org || (!isStaff(actor.role) && !(await linkedAccountIds(actor.id)).includes(org.ownerId))) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
      await db.collection("organization_members").updateOne({ organizationId: value.id, userId: value.userId }, { $set: { status: value.approved ? "approved" : "rejected" } });
    } else if (value.action === "reviewOrganization" && value.id && isStaff(actor.role)) {
      await db.collection("organizations").updateOne({ id: value.id }, { $set: { verified: Boolean(value.approved), ...(value.ownerId ? { ownerId: value.ownerId } : {}) } });
      const organization = await db.collection("organizations").findOne({ id: value.id });
      if (organization && value.approved) {
        const owner = await findManagedUser(String(organization.ownerId));
        if (owner) await db.collection("organization_members").updateOne({ userId: owner.id, organizationId: organization.id }, { $set: { displayName: owner.name, status: "approved" } }, { upsert: true });
      }
    } else if (value.action === "badge" && value.userId && isStaff(actor.role)) {
      await db.collection("profile_badges").updateOne({ userId: value.userId }, { $set: { verified: Boolean(value.approved) } }, { upsert: true });
    } else return NextResponse.json({ error: "Tidak berwenang atau data kurang lengkap" }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Perubahan gagal disimpan" }, { status: 503 }); }
}

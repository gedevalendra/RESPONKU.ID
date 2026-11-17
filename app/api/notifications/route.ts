import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createNotification,
  listNotificationRecipientIds,
  listNotifications,
  markNotificationRead,
} from "@/lib/db";
import { getActor, isStaff } from "@/lib/authz";
import { sendPushToUser } from "@/lib/push";

const input = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(500),
  href: z.string().max(3000).optional(),
  audience: z.enum(["all", "selected"]).default("all"),
  userId: z.string().min(1).optional(),
});

export async function GET() {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  return NextResponse.json({ notifications: await listNotifications(actor.id) });
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id)
    return NextResponse.json({ error: "ID notifikasi wajib diisi" }, { status: 422 });
  await markNotificationRead(body.id, actor.id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Data notifikasi tidak valid" }, { status: 422 });
  try {
    const recipientIds = parsed.data.audience === "all" ? await listNotificationRecipientIds() : parsed.data.userId ? [parsed.data.userId] : [];
    if (!recipientIds.length) return NextResponse.json({ error: "Pilih minimal satu pengguna." }, { status: 422 });
    const notifications = [];
    for (const userId of recipientIds) {
      notifications.push(await createNotification({ ...parsed.data, userId }));
      await sendPushToUser(userId, { title: parsed.data.title, body: parsed.data.body, href: parsed.data.href });
    }
    return NextResponse.json({ notifications, count: notifications.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Notifikasi gagal dikirim" }, { status: 503 });
  }
}

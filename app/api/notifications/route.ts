import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countUnreadNotifications,
  createNotification,
  listNotificationRecipients,
  listPushDeliveryHistory,
  listNotifications,
  markNotificationRead,
  savePushDeliveryHistory,
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

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  if (new URL(request.url).searchParams.get("summary") === "1") {
    try {
      return NextResponse.json({ unreadCount: await countUnreadNotifications(actor.id) }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch {
      return NextResponse.json({ error: "Jumlah notifikasi gagal dimuat" }, { status: 503 });
    }
  }
  if (new URL(request.url).searchParams.get("history") === "1") {
    if (!isStaff(actor.role)) return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
    return NextResponse.json({ history: await listPushDeliveryHistory() }, { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({ notifications: await listNotifications(actor.id) });
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor)
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id)
    return NextResponse.json({ error: "ID notifikasi wajib diisi" }, { status: 422 });
  try {
    await markNotificationRead(body.id, actor.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Status notifikasi gagal diperbarui" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor.role))
    return NextResponse.json({ error: "Tidak berwenang" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Data notifikasi tidak valid" }, { status: 422 });
  try {
    const recipients = await listNotificationRecipients();
    const recipientIds = parsed.data.audience === "all"
      ? recipients.map((recipient) => recipient.id)
      : parsed.data.userId ? [parsed.data.userId] : [];
    if (!recipientIds.length) return NextResponse.json({ error: "Pilih minimal satu pengguna." }, { status: 422 });
    const notifications = [];
    let pushSent = 0;
    let pushFailed = 0;
    let pushSubscriptions = 0;
    let pushConfigured = true;
    const deliveryRecipients = [];
    for (const userId of recipientIds) {
      notifications.push(await createNotification({ ...parsed.data, userId }));
      const delivery = await sendPushToUser(userId, { title: parsed.data.title, body: parsed.data.body, href: parsed.data.href });
      pushSent += delivery.sent;
      pushFailed += delivery.failed;
      pushSubscriptions += delivery.subscriptions;
      pushConfigured = pushConfigured && delivery.configured;
      const recipient = recipients.find((item) => item.id === userId) || { id: userId, email: "", displayName: "Pengguna" };
      deliveryRecipients.push({ ...recipient, sent: delivery.sent, failed: delivery.failed, subscriptions: delivery.subscriptions, reason: delivery.reason });
    }
    try {
      await savePushDeliveryHistory({
        title: parsed.data.title,
        body: parsed.data.body,
        href: parsed.data.href,
        audience: parsed.data.audience,
        sentAt: new Date().toISOString(),
        recipientCount: notifications.length,
        sent: pushSent,
        failed: pushFailed,
        subscriptions: pushSubscriptions,
        recipients: deliveryRecipients,
      });
    } catch (historyError) {
      console.error("Push history save failed", historyError);
    }
    return NextResponse.json({
      notifications,
      count: notifications.length,
      push: { configured: pushConfigured, sent: pushSent, failed: pushFailed, subscriptions: pushSubscriptions },
    }, { status: 201 });
  } catch (error) {
    console.error("Notification creation failed", error);
    return NextResponse.json({
      error: error instanceof Error ? `Notifikasi gagal dikirim: ${error.message}` : "Notifikasi gagal dikirim",
    }, { status: 503 });
  }
}

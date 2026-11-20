import { sendNotification, setVapidDetails } from "web-push";
import { env } from "@/lib/env";
import { listPushSubscriptions, removePushSubscription } from "@/lib/db";

let configured = false;

function configure() {
  if (configured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );
  configured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; href?: string; image?: string },
): Promise<{ configured: boolean; subscriptions: number; sent: number; failed: number; reason?: string }> {
  if (!configure()) return { configured: false, subscriptions: 0, sent: 0, failed: 0, reason: "VAPID belum dikonfigurasi" };
  const subscriptions = await listPushSubscriptions(userId);
  let sent = 0;
  let failed = 0;
  let reason = "";
  await Promise.all(
    subscriptions.map(async ({ subscription }) => {
      try {
        await sendNotification(subscription as never, JSON.stringify(payload));
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : undefined;
        reason = statusCode ? `HTTP ${statusCode}` : error instanceof Error ? error.message : "Endpoint push gagal";
        const endpoint = String(subscription.endpoint || "");
        console.error("Web Push delivery failed", { userId, statusCode, endpoint });
        if (statusCode === 404 || statusCode === 410) {
          if (endpoint) await removePushSubscription(userId, endpoint);
        }
      }
    }),
  );
  return { configured: true, subscriptions: subscriptions.length, sent, failed, reason: reason || undefined };
}

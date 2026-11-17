import webpush from "web-push";
import { env } from "@/lib/env";
import { listPushSubscriptions, removePushSubscription } from "@/lib/db";

let configured = false;

function configure() {
  if (configured) return true;
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return false;
  webpush.setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey,
  );
  configured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; href?: string },
) {
  if (!configure()) return;
  const subscriptions = await listPushSubscriptions(userId);
  await Promise.all(
    subscriptions.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription as never, JSON.stringify(payload));
      } catch (error) {
        if (typeof error === "object" && error && "statusCode" in error && error.statusCode === 410) {
          const endpoint = String(subscription.endpoint || "");
          if (endpoint) await removePushSubscription(userId, endpoint);
        }
      }
    }),
  );
}

import "server-only";
import { createNotification } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
export async function notifyActivity(input: { userId: string; title: string; body: string; href?: string }) {
  await createNotification(input);
  await sendPushToUser(input.userId, input).catch(() => null);
}

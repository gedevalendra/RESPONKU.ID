import "server-only";

import { listNotificationRecipientIds } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import type { Article } from "@/lib/types";

export async function notifyNewArticle(article: Pick<Article, "title" | "slug">) {
  const payload = {
    title: "Berita baru · ResponKu",
    body: article.title.slice(0, 180),
    href: `/artikel/${article.slug}`,
  };
  const recipients = await listNotificationRecipientIds();
  await Promise.allSettled(recipients.map((userId) => sendPushToUser(userId, payload)));
}

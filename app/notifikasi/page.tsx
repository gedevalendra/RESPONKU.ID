import Link from "next/link";
import { redirect } from "next/navigation";
import PushButton from "@/app/components/notifications/PushButton";
import { listNotifications } from "@/lib/db";
import { getActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/masuk?next=/notifikasi");
  const notifications = await listNotifications(actor.id);
  return (
    <div className="wrap py-12 sm:py-16">
      <p className="eyebrow">Pusat informasi</p>
      <h1 className="mt-3 font-display text-display-lg">Notifikasi</h1>
      <p className="mt-3 max-w-2xl text-mute">
        Informasi terbaru dari redaksi dan pembaruan aktivitas akunmu.
      </p>
      <PushButton />
      <div className="mt-10 max-w-3xl divide-y divide-rule">
        {notifications.length === 0 ? (
          <p className="py-8 text-sm text-mute">Belum ada notifikasi.</p>
        ) : (
          notifications.map((notification) => (
            <article key={notification.id} className="py-5">
              <p className="eyebrow">{notification.readAt ? "Dibaca" : "Baru"}</p>
              <h2 className="mt-2 font-display text-2xl">{notification.title}</h2>
              <p className="mt-2 leading-relaxed text-mute">{notification.body}</p>
              {notification.href && (
                <Link href={notification.href} className="mt-3 inline-block font-mono text-xs text-blue-500 hover:text-blue-700">
                  Buka informasi →
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

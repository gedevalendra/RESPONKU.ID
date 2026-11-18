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
    <div className="wrap py-8 sm:py-12">
      <div className="max-w-3xl">
      <header className="border-b border-ink pb-4">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Notifikasi</h1>
      </header>
      <section aria-label="Kotak masuk notifikasi" className="border-b border-rule">
        {notifications.length === 0 ? (
          <div className="flex items-start gap-4 py-7">
            <span className="grid size-11 shrink-0 place-items-center bg-gray-100 text-mute">
              <i className="bx bx-bell text-2xl" aria-hidden="true" />
            </span>
            <div>
            <h2 className="font-display text-xl">Belum ada notifikasi</h2>
            <p className="mt-1 text-sm leading-6 text-mute">
              Kabar dari redaksi dan pembaruan aktivitas akunmu akan muncul di sini.
            </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-rule">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex gap-4 py-5">
              <span className={`grid size-9 shrink-0 place-items-center ${notification.readAt ? "bg-gray-100 text-mute" : "bg-ink text-paper"}`}>
                <i className="bx bx-bell text-lg" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="break-words font-display text-lg">{notification.title}</h2>
                {!notification.readAt && <span className="border border-rule px-1.5 py-0.5 font-mono text-[11px] uppercase">Baru</span>}
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-mute">{notification.body}</p>
              <time dateTime={notification.createdAt} className="mt-2 block text-xs text-mute">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(notification.createdAt))} WIB
              </time>
              {notification.href && (
                <Link href={notification.href} className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline">
                  Buka informasi <i className="bx bx-right-arrow-alt align-middle text-base" aria-hidden="true" />
                </Link>
              )}
              </div>
            </li>
          ))}
          </ul>
        )}
      </section>
      <PushButton />
      </div>
    </div>
  );
}

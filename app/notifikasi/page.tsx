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
      <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Notifikasi</h1>
      <section aria-label="Kotak masuk notifikasi" className="mt-5 overflow-hidden rounded-2xl border border-rule bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="px-5 py-10 text-center sm:py-14">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-700">
              <i className="bx bx-bell text-2xl" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold">Belum ada notifikasi</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-mute">
              Kabar dari redaksi dan pembaruan aktivitas akunmu akan muncul di sini.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-rule">
          {notifications.map((notification) => (
            <li key={notification.id} className={`flex gap-3 px-4 py-4 sm:px-6 ${notification.readAt ? "" : "bg-blue-50/60"}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
                <i className="bx bx-bell text-lg" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="break-words text-sm font-semibold">{notification.title}</h2>
                {!notification.readAt && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Baru</span>}
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-mute">{notification.body}</p>
              <time dateTime={notification.createdAt} className="mt-2 block text-xs text-mute">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(notification.createdAt))} WIB
              </time>
              {notification.href && (
                <Link href={notification.href} className="mt-3 inline-block font-mono text-xs text-blue-500 hover:text-blue-700">
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

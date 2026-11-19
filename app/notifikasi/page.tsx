import { redirect } from "next/navigation";
import PushButton from "@/app/components/notifications/PushButton";
import NotificationInbox from "@/app/components/notifications/NotificationInbox";
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
        <NotificationInbox notifications={notifications} />
      </section>
      <PushButton />
      </div>
    </div>
  );
}

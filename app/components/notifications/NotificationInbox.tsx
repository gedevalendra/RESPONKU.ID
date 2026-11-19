"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";
import MarkReadButton from "@/app/components/notifications/MarkReadButton";
import type { Notification } from "@/lib/types";

export default function NotificationInbox({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const allSelected = items.length > 0 && selected.size === items.length;

  useEffect(() => {
    setItems(notifications);
    setSelected(new Set());
  }, [notifications]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  async function remove(all = false) {
    const ids = [...selected];
    if (!all && !ids.length) return;
    const prompt = all
      ? `Hapus seluruh ${items.length} notifikasi? Tindakan ini tidak dapat dibatalkan.`
      : `Hapus ${ids.length} notifikasi yang dipilih? Tindakan ini tidak dapat dibatalkan.`;
    if (!(await confirmAction(prompt, "Hapus"))) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { ids }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notifikasi gagal dihapus.");
      setItems((current) => all ? [] : current.filter((item) => !selected.has(item.id)));
      setSelected(new Set());
      setMessage(data.deleted ? `${data.deleted} notifikasi dihapus.` : "Tidak ada notifikasi yang dihapus.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifikasi gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <>
        <div className="flex items-start gap-4 py-7">
          <span className="grid size-11 shrink-0 place-items-center bg-gray-100 text-mute"><i className="bx bx-bell text-2xl" aria-hidden="true" /></span>
          <div><h2 className="font-display text-xl">Belum ada notifikasi</h2><p className="mt-1 text-sm leading-6 text-mute">Kabar dari redaksi dan pembaruan aktivitas akunmu akan muncul di sini.</p></div>
        </div>
        <PopupStatus message={message} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={busy} className="size-4 accent-blue-600" />
          Pilih semua
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && <span className="text-sm text-mute">{selected.size} dipilih</span>}
          <button type="button" disabled={busy || selected.size === 0} onClick={() => void remove()} className="min-h-9 border border-rule px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40">Hapus pilihan</button>
          <button type="button" disabled={busy} onClick={() => void remove(true)} className="min-h-9 border border-red-200 px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40">Hapus semua</button>
        </div>
      </div>
      <ul className="divide-y divide-rule">
        {items.map((notification) => (
          <li key={notification.id} className="flex gap-3 py-5 sm:gap-4">
            <input type="checkbox" checked={selected.has(notification.id)} onChange={() => toggle(notification.id)} disabled={busy} aria-label={`Pilih notifikasi ${notification.title}`} className="mt-2 size-4 shrink-0 accent-blue-600" />
            <span className={`grid size-9 shrink-0 place-items-center ${notification.readAt ? "bg-gray-100 text-mute" : "bg-ink text-paper"}`}><i className="bx bx-bell text-lg" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="break-words font-display text-lg">{notification.title}</h2>{!notification.readAt && <span className="border border-rule px-1.5 py-0.5 font-mono text-[11px] uppercase">Baru</span>}</div>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-mute">{notification.body}</p>
              <time dateTime={notification.createdAt} className="mt-2 block text-xs text-mute">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(notification.createdAt))} WIB</time>
              {notification.href && <Link href={notification.href} className="mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline">Buka informasi <i className="bx bx-right-arrow-alt align-middle text-base" aria-hidden="true" /></Link>}
              {!notification.readAt && <div><MarkReadButton id={notification.id} /></div>}
            </div>
          </li>
        ))}
      </ul>
      <PopupStatus message={message} />
    </>
  );
}

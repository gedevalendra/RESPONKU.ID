"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

import { useEffect, useState } from "react";

type Recipient = { id: string; email: string; displayName: string; username?: string };
type PushHistory = {
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
  sent: number;
  failed: number;
  subscriptions: number;
  recipients?: Array<{ id: string; email: string; displayName: string; sent: number; failed: number; subscriptions: number; reason?: string }>;
};

export default function NotificationComposer() {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<PushHistory[]>([]);

  useEffect(() => {
    void fetch("/api/notifications?history=1", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.history) setHistory(data.history); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (audience !== "selected") return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/admin/notification-recipients?q=${encodeURIComponent(query)}`);
      if (response.ok) setUsers((await response.json()).users || []);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [audience, query]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        userId: audience === "selected" ? selected?.id : undefined,
        title: form.get("title"),
        body: form.get("body"),
        href: form.get("href") || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      const push = data.push as { configured?: boolean; sent?: number; failed?: number; subscriptions?: number } | undefined;
      if (push?.configured === false) {
        setMessage(`Notifikasi tersimpan untuk ${data.count} pengguna, tetapi VAPID belum dikonfigurasi di server.`);
      } else if (push?.sent) {
        setMessage(`Notifikasi tersimpan untuk ${data.count} pengguna dan dikirim ke ${push.sent} perangkat.`);
      } else if (push?.subscriptions === 0) {
        setMessage(`Notifikasi tersimpan untuk ${data.count} pengguna, tetapi belum ada perangkat yang mengaktifkan notifikasi.`);
      } else {
        setMessage(`Notifikasi tersimpan, tetapi pengiriman push gagal${push?.failed ? ` pada ${push.failed} perangkat` : ""}.`);
      }
    } else {
      setMessage(data.error || "Notifikasi gagal dikirim.");
    }
    if (response.ok) {
      formElement.reset();
      setSelected(null);
      setQuery("");
      setAudience("all");
      const historyResponse = await fetch("/api/notifications?history=1", { cache: "no-store" });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
    <form onSubmit={submit} className="min-w-0 space-y-6 rounded-2xl border border-rule bg-paper p-5 shadow-sm sm:p-7 [&_input:not([type=radio])]:min-h-12 [&_input:not([type=radio])]:w-full [&_input:not([type=radio])]:rounded-lg [&_input:not([type=radio])]:px-4 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:p-4">
      <div><h2 className="text-xl font-semibold">Buat notifikasi</h2><p className="mt-2 text-sm leading-6 text-mute">Pilih penerima dan tulis pesan singkat yang ingin Anda sampaikan.</p></div>
      <fieldset className="grid gap-3">
        <legend className="eyebrow">Penerima</legend>
        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm text-ink ${audience === "all" ? "border-blue-300 bg-blue-50" : "border-rule"}`}>
          <input type="radio" checked={audience === "all"} onChange={() => setAudience("all")} /> Semua pengguna
        </label>
        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm text-ink ${audience === "selected" ? "border-blue-300 bg-blue-50" : "border-rule"}`}>
          <input type="radio" checked={audience === "selected"} onChange={() => setAudience("selected")} /> Pengguna tertentu
        </label>
      </fieldset>

      {audience === "selected" && (
        <div className="relative grid gap-2">
          <label className="eyebrow" htmlFor="recipient-search">Cari pengguna</label>
          <input id="recipient-search" value={selected ? `${selected.displayName} — ${selected.email}` : query} onChange={(event) => { setSelected(null); setQuery(event.target.value); }} placeholder="Cari nama, email, atau username" />
          {!selected && users.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 bg-paper shadow-xl">
              {users.map((user) => (
                <button type="button" key={user.id} onClick={() => { setSelected(user); setUsers([]); }} className="block w-full px-4 py-3 text-left text-sm hover:bg-blue-50">
                  <span className="block font-medium text-ink">{user.displayName}</span>
                  <span className="block text-xs text-mute">{user.email}{user.username ? ` · @${user.username}` : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <label className="grid gap-2 text-sm"><span className="eyebrow">Judul notifikasi</span><input name="title" required maxLength={120} placeholder="Informasi terbaru" /></label>
      <label className="grid gap-2 text-sm"><span className="eyebrow">Isi pesan</span><textarea name="body" required maxLength={500} className="min-h-32" placeholder="Tulis informasi untuk pengguna..." /></label>
      <label className="grid gap-2 text-sm"><span className="eyebrow">Tautan (opsional)</span><input name="href" placeholder="/artikel/judul-berita atau https://..." /></label>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={busy || (audience === "selected" && !selected)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><i aria-hidden="true" className="bx bx-send text-lg" />{busy ? "Mengirim..." : "Kirim notifikasi"}</button>
        {message && <PopupStatus message={message} />}
      </div>
    </form>
    <aside className="min-w-0 rounded-2xl border border-rule bg-paper p-5 shadow-sm sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Riwayat pengiriman</h2>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-mute">{history.length} kiriman</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-mute">Status terkirim berarti layanan push menerima pesan. Kemunculan notifikasi di HP belum dapat dipastikan dari status ini.</p>
      {history.length === 0 ? <p className="mt-6 text-sm leading-6 text-mute">Belum ada riwayat pengiriman.</p> : <div className="mt-6 divide-y divide-rule">
        {history.map((item, index) => {
          const notReceived = (item.recipients || []).filter((recipient) => recipient.sent === 0);
          return <article key={`${item.sentAt}-${index}`} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-medium text-ink">{item.title}</h3><time className="mt-1 block text-xs text-mute">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.sentAt))} WIB</time></div><span className="shrink-0 text-xs text-mute">{item.sent}/{item.recipientCount}</span></div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-mute"><span>{item.sent} terkirim</span><span>{item.subscriptions} perangkat</span><span>{item.failed} gagal</span></div>
            {notReceived.length > 0 && <details className="mt-4 rounded-lg bg-gray-50 p-3 text-xs"><summary className="cursor-pointer py-1 font-medium text-ink">Detail akun tanpa push terkirim ({notReceived.length})</summary><ul className="mt-3 max-h-64 space-y-3 overflow-y-auto text-mute">{notReceived.map((recipient) => <li key={recipient.id} className="break-words border-t border-rule pt-3"><span className="block font-medium text-ink">{recipient.displayName}</span><span className="mt-1 block break-all">{recipient.email || "Email tidak tersedia"}</span><span className="mt-2 block text-amber-700">{recipient.reason || (recipient.subscriptions ? "Push gagal" : "Belum ada perangkat terdaftar")}</span></li>)}</ul></details>}
          </article>;
        })}
      </div>}
    </aside>
    </div>
  );
}

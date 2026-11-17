"use client";

import { useEffect, useState } from "react";

type Recipient = { id: string; email: string; displayName: string; username?: string };

export default function NotificationComposer() {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
    const form = new FormData(event.currentTarget);
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
    setMessage(response.ok ? `Notifikasi dikirim ke ${data.count} pengguna.` : data.error || "Notifikasi gagal dikirim.");
    if (response.ok) {
      event.currentTarget.reset();
      setSelected(null);
      setQuery("");
      setAudience("all");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 bg-paper p-6 sm:p-8">
      <fieldset className="grid gap-3">
        <legend className="eyebrow">Penerima</legend>
        <label className="flex items-center gap-3 text-sm text-ink">
          <input type="radio" checked={audience === "all"} onChange={() => setAudience("all")} /> Semua pengguna
        </label>
        <label className="flex items-center gap-3 text-sm text-ink">
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
        <button disabled={busy || (audience === "selected" && !selected)} className="bg-blue-500 px-5 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600 disabled:opacity-50">{busy ? "Mengirim..." : "Kirim notifikasi"}</button>
        {message && <span className="font-mono text-xs text-mute">{message}</span>}
      </div>
    </form>
  );
}

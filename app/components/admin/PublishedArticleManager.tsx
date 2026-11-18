"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";
import type { Article } from "@/lib/types";

type PublishedArticle = Pick<Article, "id" | "slug" | "title" | "author" | "views" | "promoted">;
type PublicationAction = { action: "takedown"; note: string } | { action: "promote"; promoted: boolean };

export default function PublishedArticleManager({ articles }: { articles: PublishedArticle[] }) {
  const [items, setItems] = useState(articles);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<PublishedArticle | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const visibleItems = items.filter((item) =>
    `${item.title} ${item.author}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function apply(article: PublishedArticle, action?: PublicationAction) {
    setBusy(true);
    setMessage("");
    setNoteError("");
    const url = `/api/admin/articles/${encodeURIComponent(article.id)}`;
    try {
      const response = await fetch(action ? `${url}/publication` : url, action ? {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      } : { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Perubahan gagal disimpan.");
      }
      if (action?.action === "promote") {
        setItems((current) => current.map((item) => item.id === article.id ? { ...item, promoted: action.promoted } : item));
        setMessage(action.promoted ? "Artikel diprioritaskan di Terpopuler." : "Prioritas artikel dihentikan.");
      } else {
        setItems((current) => current.filter((item) => item.id !== article.id));
        if (action) dialog.current?.close();
        setMessage(action ? "Artikel ditarik dari situs." : "Artikel dihapus.");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Perubahan gagal disimpan.";
      if (action?.action === "takedown") setNoteError(text);
      else setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  function openTakedown(article: PublishedArticle) {
    setTarget(article);
    setNote("");
    setNoteError("");
    dialog.current?.showModal();
  }

  return (
    <section className="rounded-xl border border-rule bg-white p-4 sm:p-6">
      <label className="grid max-w-md gap-2 text-sm font-medium">
        Cari artikel terbit
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Judul atau penulis" className="rounded-lg border border-rule px-3 py-2" />
      </label>
      <ul className="mt-4 divide-y divide-rule">
        {visibleItems.map((article) => (
          <li key={article.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <Link href={`/artikel/${encodeURIComponent(article.slug)}`} className="break-words font-semibold hover:underline">{article.title}</Link>
              <p className="mt-1 text-sm text-mute">{article.author} · {article.views.toLocaleString("id-ID")} tayangan{article.promoted && " · Diprioritaskan"}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" disabled={busy} onClick={() => void apply(article, { action: "promote", promoted: !article.promoted })}
                className="rounded-lg border border-rule px-3 py-2 hover:bg-gray-50 disabled:opacity-50">{article.promoted ? "Hentikan promosi" : "Promosikan"}</button>
              <button type="button" disabled={busy} onClick={() => openTakedown(article)}
                className="rounded-lg border border-rule px-3 py-2 hover:bg-gray-50 disabled:opacity-50">Takedown</button>
              <button type="button" disabled={busy} onClick={async () => {
                if (await confirmAction(`Hapus “${article.title}” secara permanen?`, "Hapus")) await apply(article);
              }} className="rounded-lg px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50">Hapus</button>
            </div>
          </li>
        ))}
      </ul>
      {!visibleItems.length && <p className="py-5 text-sm text-mute">Tidak ada artikel terbit yang cocok.</p>}
      <PopupStatus message={message} />
      <dialog ref={dialog} aria-labelledby="takedown-title" onCancel={(event) => { if (busy) event.preventDefault(); }}
        className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40">
        <h2 id="takedown-title" className="text-lg font-semibold">Tarik artikel dari situs?</h2>
        <p className="mt-2 break-words text-sm text-mute">{target?.title}</p>
        <form className="mt-4 grid gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (target && note.trim() && !busy) void apply(target, { action: "takedown", note });
        }}>
          <label className="grid gap-2 text-sm font-medium">
            Catatan untuk penulis
            <textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={500}
              rows={4} className="rounded-lg border border-rule p-3" />
          </label>
          {noteError && <p role="alert" className="text-sm text-red-700">{noteError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => dialog.current?.close()} className="rounded-lg border border-rule px-4 py-2">Batal</button>
            <button disabled={busy || !note.trim()} className="rounded-lg bg-ink px-4 py-2 text-paper disabled:opacity-50">{busy ? "Memproses…" : "Tarik artikel"}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

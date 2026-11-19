"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";
import type { Article } from "@/lib/types";

type PublishedArticle = Pick<Article, "id" | "slug" | "title" | "author" | "views" | "promoted">;
type PublicationAction = { action: "takedown"; note: string } | { action: "promote"; promoted: boolean } | { action: "pin"; pinned: boolean };

export default function PublishedArticleManager({ articles, pinnedIds, canDelete }: { articles: PublishedArticle[]; pinnedIds: string[]; canDelete: boolean }) {
  const [items, setItems] = useState(articles);
  const [pinnedArticleIds, setPinnedArticleIds] = useState(pinnedIds);
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
      if (action?.action === "pin") {
        const data = await response.json();
        setPinnedArticleIds(data.pinnedIds);
        setMessage(action.pinned ? "Artikel disematkan sebagai berita utama." : "Sematan berita utama dilepas.");
      } else if (action?.action === "promote") {
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
    <section className="overflow-hidden rounded-xl border border-rule bg-white">
      <div className="flex flex-col gap-4 border-b border-rule p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-2xl">Kelola artikel terbit</h2>
          <p className="mt-1 text-sm text-mute">Atur berita utama, promosi, atau status publikasi artikel.</p>
        </div>
        <label className="grid w-full max-w-md gap-2 text-sm font-medium">
          Cari artikel
          <span className="relative">
            <i className="bx bx-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-mute" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Judul atau penulis" className="w-full rounded-lg border border-rule py-2.5 pl-10 pr-3" />
          </span>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-gray-50 px-4 py-3 text-sm sm:px-6">
        <span className="font-medium text-ink">{visibleItems.length} artikel</span>
        <span className="text-mute">Sematan dapat dipilih lebih dari satu.</span>
      </div>
      <ul className="divide-y divide-rule px-4 sm:px-6">
        {visibleItems.map((article) => (
          <li key={article.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Link href={`/artikel/${encodeURIComponent(article.slug)}`} className="block line-clamp-2 font-semibold leading-snug hover:underline">{article.title}</Link>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mute">
                <span>{article.author}</span>
                <span aria-hidden="true">·</span>
                <span>{article.views.toLocaleString("id-ID")} tayangan</span>
                {article.promoted && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Diprioritaskan</span>}
                {pinnedArticleIds.includes(article.id) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Berita utama</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm lg:justify-end">
              <button type="button" disabled={busy} aria-pressed={pinnedArticleIds.includes(article.id)}
                onClick={() => void apply(article, { action: "pin", pinned: !pinnedArticleIds.includes(article.id) })}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rule px-3 py-2 hover:bg-gray-50 aria-pressed:border-blue-200 aria-pressed:bg-blue-50 aria-pressed:text-blue-700 disabled:opacity-50">
                <i className="bx bx-pin" aria-hidden="true" />
                {pinnedArticleIds.includes(article.id) ? "Lepas sematan" : "Berita utama"}
              </button>
              <button type="button" disabled={busy} aria-pressed={article.promoted} onClick={() => void apply(article, { action: "promote", promoted: !article.promoted })}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rule px-3 py-2 hover:bg-gray-50 aria-pressed:border-amber-200 aria-pressed:bg-amber-50 aria-pressed:text-amber-800 disabled:opacity-50">
                <i className="bx bx-star" aria-hidden="true" />
                {article.promoted ? "Prioritas aktif" : "Promosikan"}
              </button>
              <details className="relative">
                <summary className="flex min-h-10 list-none items-center gap-1 rounded-lg border border-rule px-3 py-2 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                  Lainnya <i className="bx bx-chevron-down text-lg" aria-hidden="true" />
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 grid min-w-40 overflow-hidden rounded-lg border border-rule bg-white p-1 shadow-lg">
                  <button type="button" disabled={busy} onClick={() => openTakedown(article)} className="rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50">Takedown</button>
                  {canDelete && <button type="button" disabled={busy} onClick={async () => {
                    if (await confirmAction(`Hapus “${article.title}” secara permanen?`, "Hapus")) await apply(article);
                  }} className="rounded px-3 py-2 text-left text-red-700 hover:bg-red-50 disabled:opacity-50">Hapus permanen</button>}
                </div>
              </details>
            </div>
          </li>
        ))}
      </ul>
      {!visibleItems.length && <p className="px-4 py-10 text-center text-sm text-mute sm:px-6">Tidak ada artikel terbit yang cocok.</p>}
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

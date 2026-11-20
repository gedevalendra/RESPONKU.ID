"use client";

import { useRef, useState } from "react";

type IndexedArticle = {
  title: string;
  url: string;
  lastCrawlTime?: string;
  inspectionResultLink?: string;
};
type IndexResponse = { articles?: IndexedArticle[]; checked?: number; error?: string };

export default function GoogleIndexMenu() {
  const [closing, setClosing] = useState(false);
  const [articles, setArticles] = useState<IndexedArticle[]>([]);
  const [checked, setChecked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/google-index", { cache: "no-store" });
      const data = (await response.json()) as IndexResponse;
      if (!response.ok) throw new Error(data.error || "Pemeriksaan indeks Google gagal.");
      setArticles(data.articles || []);
      setChecked(data.checked || 0);
      setLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pemeriksaan indeks Google gagal.");
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    setClosing(false);
    dialog.current?.showModal();
    if (!loaded && !loading) void load();
  };

  const close = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.current?.close();
      return;
    }
    setClosing(true);
  };

  const finishClose = () => {
    if (closing) {
      dialog.current?.close();
      setClosing(false);
    }
  };

  return (
    <>
      <section className="w-full" aria-label="Pemeriksaan artikel">
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="w-full group flex items-center justify-between rounded-xl border border-rule bg-paper p-4 text-center sm:text-left"
        >
          <p className="text-xs font-medium sm:text-sm">Artikel Terindeks di Google</p>
          <p className="text-xs leading-4 text-mute">{loaded ? `${articles.length} artikel terindeks` : "Periksa status Search Console"}</p>
        </button>
      </section>

      <dialog
        ref={dialog}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onAnimationEnd={finishClose}
        className={`${closing ? "activity-sheet-closing" : "activity-sheet"} fixed inset-x-0 top-auto bottom-0 m-0 h-[80dvh] max-h-[80dvh] w-full max-w-none rounded-t-3xl bg-paper p-0 shadow-2xl backdrop:bg-black/40`}
      >
        <section className="flex h-full flex-col" aria-labelledby="google-index-title">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-5 py-4 sm:px-8">
            <div>
              <p className="eyebrow">Google Search Console</p>
              <h2 id="google-index-title" className="mt-1 font-display text-2xl">Artikel Terindeks</h2>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void load()} disabled={loading} aria-label="Periksa ulang" title="Periksa ulang" className="grid size-10 place-items-center rounded-full hover:bg-gray-100 disabled:opacity-50">
                <i className={`bx bx-refresh text-xl ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              </button>
              <button type="button" onClick={close} aria-label="Tutup" className="grid size-10 place-items-center rounded-full hover:bg-gray-100">
                <i className="bx bx-x text-2xl" aria-hidden="true" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-8">
            <p className="mb-4 text-sm text-mute">
              Daftar ini hanya menampilkan artikel yang Search Console laporkan sudah terindeks di Google.
            </p>
            {loading ? (
              <p role="status" className="py-10 text-center text-sm text-mute">Memeriksa artikel di Google Search Console...</p>
            ) : error ? (
              <div role="alert" className="py-10 text-center">
                <p className="text-sm text-mute">{error}</p>
                <button type="button" onClick={() => void load()} className="mt-3 text-sm font-medium text-blue-700 underline underline-offset-4">Coba lagi</button>
              </div>
            ) : articles.length ? (
              <ul className="divide-y divide-rule">
                {articles.map((article) => (
                  <li key={article.url} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <a href={article.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">{article.title}</a>
                      <p className="mt-1 text-xs text-mute">
                        {article.lastCrawlTime
                          ? `Terakhir dirayapi ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.lastCrawlTime))}`
                          : "Terindeks di Google"}
                      </p>
                    </div>
                    {article.inspectionResultLink && (
                      <a href={article.inspectionResultLink} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-blue-700 underline underline-offset-4">
                        Detail indeks <i className="bx bx-link-external" aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-mute">
                {checked ? "Belum ada artikel terbit yang terdeteksi terindeks oleh Google." : "Belum ada artikel terbit untuk diperiksa."}
              </p>
            )}
          </div>
        </section>
      </dialog>
    </>
  );
}
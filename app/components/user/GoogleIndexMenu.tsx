"use client";

import { useRef, useState } from "react";

type PublishedArticle = { title: string; googleSearchUrl: string };

export default function GoogleIndexMenu({ articles }: { articles: PublishedArticle[] }) {
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const open = () => {
    setClosing(false);
    dialog.current?.showModal();
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
          <p className="text-xs font-medium sm:text-sm">Cek Artikel di Google</p>
          <p className=" text-xs leading-4 text-mute block">{articles.length} artikel terbit</p>
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
              <p className="eyebrow">Artikel terbit</p>
              <h2 id="google-index-title" className="mt-1 font-display text-2xl">Cek di Google</h2>
            </div>
            <button type="button" onClick={close} aria-label="Tutup" className="grid size-10 place-items-center rounded-full hover:bg-gray-100">
              <i className="bx bx-x text-2xl" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:px-8">
            <p className="mb-4 text-sm text-mute">
              Jika artikel muncul di hasil pencarian, Google sudah menemukannya. Artikel baru mungkin perlu waktu untuk terindeks.
            </p>
            {articles.length ? (
              <ul className="divide-y divide-rule">
                {articles.map((article) => (
                  <li key={article.googleSearchUrl} className="flex items-center justify-between gap-4 py-4">
                    <p className="min-w-0 text-sm font-medium">{article.title}</p>
                    <a
                      href={article.googleSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-sm font-medium text-blue-700 underline underline-offset-4"
                    >
                      Cari di Google <i className="bx bx-link-external" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-mute">Belum ada artikel yang diterbitkan.</p>
            )}
          </div>
        </section>
      </dialog>
    </>
  );
}
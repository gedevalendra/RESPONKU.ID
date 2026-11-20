"use client";

import { useEffect, useRef, useState } from "react";

type IndexedArticle = {
  title: string;
  url: string;
  lastCrawlTime?: string;
  inspectionResultLink?: string;
};
type IndexResponse = { articles?: IndexedArticle[]; checked?: number; error?: string };

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const DISMISS_DISTANCE = 120; // px
const DISMISS_VELOCITY = 0.6; // px/ms

export default function GoogleIndexMenu() {
  const [closing, setClosing] = useState(false);
  const [articles, setArticles] = useState<IndexedArticle[]>([]);
  const [checked, setChecked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velocity: 0, dy: 0 });

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
    const el = dialog.current;
    if (!el) return;
    el.style.setProperty("--drag", "0px");
    setClosing(false);
    el.showModal();
    document.body.style.overflow = "hidden";
    if (!loaded && !loading) void load();
  };

  const finish = () => {
    const el = dialog.current;
    if (el?.open) el.close();
    el?.style.setProperty("--drag", "0px");
    setClosing(false);
    document.body.style.overflow = "";
  };

  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    setClosing(true);
  };

  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  /* ---------- Geser ke bawah untuk menutup ---------- */
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const d = drag.current;
    d.active = true; d.startY = event.clientY; d.lastY = event.clientY; d.lastT = event.timeStamp; d.velocity = 0; d.dy = 0;
    dialog.current?.style.removeProperty("transition");
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const raw = event.clientY - d.startY;
    d.dy = raw > 0 ? raw : raw * 0.15;
    const dt = event.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (event.clientY - d.lastY) / dt;
    d.lastY = event.clientY; d.lastT = event.timeStamp;
    dialog.current?.style.setProperty("--drag", `${d.dy}px`);
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.dy > DISMISS_DISTANCE || d.velocity > DISMISS_VELOCITY) { close(); return; }
    const el = dialog.current;
    if (!el) return;
    el.style.transition = "transform .35s var(--sheet-ease)";
    el.style.setProperty("--drag", "0px");
    window.setTimeout(() => el.style.removeProperty("transition"), 360);
  };

  return (
    <>
      <section className="w-full" aria-label="Pemeriksaan artikel">
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="group flex w-full items-center gap-3 rounded-2xl border border-rule bg-paper p-4 text-left transition duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-800 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
            <i className="bxl bx-google text-xl" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Artikel terindeks di Google</span>
            <span className="mt-0.5 block text-xs text-mute">{loaded ? `${articles.length} artikel terindeks` : "Periksa status Search Console"}</span>
          </span>
          <i className="bx bx-chevron-right text-xl text-gray-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </section>

      <dialog
        ref={dialog}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => { document.body.style.overflow = ""; }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onAnimationEnd={(event) => { if (event.target === event.currentTarget && closing) finish(); }}
        aria-labelledby="google-index-title"
        className={`${closing ? "activity-sheet-closing" : "activity-sheet"} fixed inset-x-0 bottom-0 top-auto m-0 mx-auto h-[82dvh] max-h-[82dvh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border-0 bg-paper p-0 text-inherit shadow-[0_-12px_48px_rgba(0,0,0,.18)] backdrop:bg-black/45 backdrop:backdrop-blur-[2px]`}
      >
        <div className="flex h-full flex-col">
          {/* Area geser: handle + header */}
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="shrink-0 cursor-grab touch-none select-none border-b border-rule active:cursor-grabbing">
            <div className="flex justify-center pb-1 pt-3" aria-hidden="true"><span className="h-1.5 w-10 rounded-full bg-gray-300" /></div>
            <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-2 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-700"><i className="bxl bx-google text-xl" aria-hidden="true" /></span>
                <div>
                  <h2 id="google-index-title" className="font-display text-xl leading-6">Artikel terindeks</h2>
                  <p className="text-xs text-mute">Google Search Console</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void load()} disabled={loading} aria-label="Periksa ulang" title="Periksa ulang" className="grid size-10 place-items-center rounded-full transition hover:bg-gray-100 active:scale-90 disabled:opacity-50">
                  <i className={`bx bx-refresh text-xl ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                </button>
                <button type="button" onClick={close} aria-label="Tutup" className="grid size-10 place-items-center rounded-full transition hover:bg-gray-100 active:scale-90">
                  <i className="bx bx-x text-2xl" aria-hidden="true" />
                </button>
              </div>
            </header>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 pt-4 sm:px-8">
            <p className="mb-3 text-xs leading-5 text-mute">
              Hanya artikel yang dilaporkan Search Console sudah terindeks yang ditampilkan di sini.
              {loaded && !loading && !error && checked > 0 && <> <span className="font-medium text-gray-800">{articles.length} dari {checked}</span> artikel terbit terindeks.</>}
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {loading ? (
                <ul role="status" aria-label="Memeriksa artikel di Google Search Console" className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-center gap-3 rounded-2xl p-2.5">
                      <span className="size-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3.5 w-4/5 animate-pulse rounded bg-gray-100" />
                        <span className="block h-3 w-2/5 animate-pulse rounded bg-gray-100" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : error ? (
                <div role="alert" className="grid h-full place-items-center py-10 text-center">
                  <div className="max-w-xs">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-600"><i className="bx bx-error-circle text-2xl" aria-hidden="true" /></span>
                    <p className="mt-4 text-sm font-medium">Pemeriksaan gagal</p>
                    <p className="mt-1 text-sm text-mute">{error}</p>
                    <button type="button" onClick={() => void load()} className="mt-4 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-95">Coba lagi</button>
                  </div>
                </div>
              ) : articles.length ? (
                <ul className="space-y-2">
                  {articles.map((article, i) => (
                    <li key={article.url} className="sheet-item" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                      <div className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-gray-50">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green-50 text-green-700"><i className="bx bx-check text-xl" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1">
                          <a href={article.url} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-medium leading-5 hover:underline">{article.title}</a>
                          <p className="mt-0.5 text-xs text-mute">
                            {article.lastCrawlTime
                              ? `Terakhir dirayapi ${dateFormat.format(new Date(article.lastCrawlTime))}`
                              : "Terindeks di Google"}
                          </p>
                        </div>
                        {article.inspectionResultLink && (
                          <a href={article.inspectionResultLink} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 active:scale-95">
                            Detail <i className="bx bx-link-external" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid h-full place-items-center py-10 text-center">
                  <div className="max-w-xs">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-gray-100 text-gray-500"><i className="bx bx-search-alt text-2xl" aria-hidden="true" /></span>
                    <p className="mt-4 text-sm font-medium">Belum ada artikel terindeks</p>
                    <p className="mt-1 text-sm text-mute">
                      {checked ? "Belum ada artikel terbit yang terdeteksi terindeks oleh Google." : "Belum ada artikel terbit untuk diperiksa."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
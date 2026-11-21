"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Reading = { articleSlug: string; progress: number; anchorText?: string; updatedAt: string; article: { slug: string; title: string; thumbnailUrl: string } };
type Tab = "continue" | "history" | "liked" | "comments";

const details: Record<Tab, { label: string; icon: string; description: string; hint: string; empty: string }> = {
  continue: { label: "Lanjut baca", icon: "bx-book-open", description: "Bacaan belum selesai", hint: "Lanjutkan dari titik baca terakhir.", empty: "Semua bacaan sudah selesai. Pilih artikel baru untuk mulai membaca." },
  history: { label: "Riwayat", icon: "bx-history", description: "Semua artikel yang dibaca", hint: "Artikel yang pernah Anda buka.", empty: "Riwayat akan muncul setelah Anda membaca artikel." },
  liked: { label: "Disukai", icon: "bx-heart", description: "Artikel yang Anda sukai", hint: "Artikel yang Anda beri suka.", empty: "Ketuk ikon suka pada artikel agar tersimpan di sini." },
  comments: { label: "Komentar", icon: "bx-message-square-detail", description: "Komentar Anda", hint: "Komentar yang pernah Anda tulis.", empty: "Komentar Anda pada artikel akan muncul di sini." },
};

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const DISMISS_DISTANCE = 120; // px
const DISMISS_VELOCITY = 0.6; // px/ms

export default function ReadingActivityMenu({ readingHistory }: { readingHistory: Reading[] }) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [newest, setNewest] = useState(true);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velocity: 0, dy: 0 });

  const unfinished = useMemo(() => readingHistory.filter((item) => item.progress < 0.96), [readingHistory]);

  const open = (value: Tab) => {
    const el = dialog.current;
    if (!el) return;
    el.style.setProperty("--drag", "0px");
    setClosing(false);
    setTab(value);
    el.showModal();
    document.body.style.overflow = "hidden";
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

  // Pastikan scroll halaman kembali normal jika komponen dilepas saat sheet terbuka
  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  const items = useMemo(() => {
    const list = tab === "continue" ? unfinished : tab === "history" ? readingHistory : [];
    return [...list].sort((a, b) => (newest ? +new Date(b.updatedAt) - +new Date(a.updatedAt) : +new Date(a.updatedAt) - +new Date(b.updatedAt)));
  }, [readingHistory, unfinished, newest, tab]);

  /* ---------- Geser ke bawah untuk menutup ---------- */
  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return; // jangan ganggu tombol di header
    const d = drag.current;
    d.active = true; d.startY = event.clientY; d.lastY = event.clientY; d.lastT = event.timeStamp; d.velocity = 0; d.dy = 0;
    dialog.current?.style.removeProperty("transition");
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const raw = event.clientY - d.startY;
    // ke atas diberi hambatan, ke bawah mengikuti jari
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

  return <>
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Aktivitas akun">
      {(Object.keys(details) as Tab[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => open(key)}
          className="group flex min-h-28 flex-col items-center gap-2 rounded-2xl border border-rule bg-paper p-3 text-center transition duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:items-start sm:p-4 sm:text-left"
        >
          <span className="relative grid size-10 place-items-center rounded-full bg-gray-100 text-gray-800 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
            <i className={`bx ${details[key].icon} text-xl`} aria-hidden="true" />
            {key === "continue" && unfinished.length > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-5 text-white">{unfinished.length}</span>
            )}
          </span>
          <span>
            <span className="block text-xs font-medium sm:text-sm">{details[key].label}</span>
            <span className="mt-1 hidden text-xs leading-4 text-mute sm:block">{key === "continue" ? `${unfinished.length} belum selesai` : details[key].description}</span>
          </span>
        </button>
      ))}
    </section>

    <dialog
      ref={dialog}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { document.body.style.overflow = ""; }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onAnimationEnd={(event) => { if (event.target === event.currentTarget && closing) finish(); }}
      aria-labelledby="reading-sheet-title"
      className={`${closing ? "activity-sheet-closing" : "activity-sheet"} fixed inset-x-0 bottom-0 top-auto m-0 mx-auto h-[82dvh] max-h-[82dvh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border-0 bg-paper p-0 text-inherit shadow-[0_-12px_48px_rgba(0,0,0,.18)] backdrop:bg-black/45 backdrop:backdrop-blur-[2px]`}
    >
      {tab && (
        <div className="flex h-full flex-col">
          {/* Area geser: handle + header */}
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="shrink-0 cursor-grab touch-none select-none border-b border-rule active:cursor-grabbing">
            <div className="flex justify-center pb-1 pt-3" aria-hidden="true"><span className="h-1.5 w-10 rounded-full bg-gray-300" /></div>
            <header className="flex items-center justify-between gap-3 px-5 pb-4 pt-2 sm:px-8">
              <div className="flex items-center gap-3">
                <div>
                  <h2 id="reading-sheet-title" className="font-display text-xl leading-6">{details[tab].label}</h2>
                  <p className="text-xs text-mute">{details[tab].hint}</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="Tutup" className="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-gray-100 active:scale-90 focus-visible:outline-2 focus-visible:outline-blue-600"><i className="bx bx-x text-2xl" aria-hidden="true" /></button>
            </header>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 pt-4 sm:px-8">
            {(tab === "continue" || tab === "history") && (
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-mute">{items.length} artikel</p>
                <div className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs font-medium" role="group" aria-label="Urutkan">
                  {[{ v: true, l: "Terbaru" }, { v: false, l: "Terlama" }].map((o) => (
                    <button key={o.l} type="button" aria-pressed={newest === o.v} onClick={() => setNewest(o.v)} className={`rounded-full px-3 py-1 transition ${newest === o.v ? "bg-paper text-gray-900 shadow-sm" : "text-mute hover:text-gray-900"}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            )}

            <div key={tab} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {items.length ? (
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={item.articleSlug} className="sheet-item" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                      <Link href={`/artikel/${encodeURIComponent(item.article.slug)}`} onClick={close} className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-gray-50 active:bg-gray-100">
                        {item.article.thumbnailUrl
                          ? <img src={item.article.thumbnailUrl} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" />
                          : <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-400"><i className="bx bx-image text-2xl" aria-hidden="true" /></span>}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium leading-5">{item.article.title}</p>
                          {item.anchorText && <p className="mt-0.5 line-clamp-1 text-xs italic text-mute">“{item.anchorText}”</p>}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={Math.floor(item.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.floor(item.progress * 100))}%` }} />
                            </div>
                            <span className="text-[11px] tabular-nums text-mute">{Math.floor(item.progress * 100)}%</span>
                          </div>
                          <p className="mt-1 text-[11px] text-mute">{dateFormat.format(new Date(item.updatedAt))}</p>
                        </div>
                        <i className="bx bx-chevron-right text-xl text-gray-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid h-full place-items-center py-10 text-center">
                  <div className="max-w-xs">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-gray-100 text-gray-500"><i className={`bx ${details[tab].icon} text-2xl`} aria-hidden="true" /></span>
                    <p className="mt-4 text-sm font-medium">Belum ada aktivitas</p>
                    <p className="mt-1 text-sm text-mute">{details[tab].empty}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  </>;
}
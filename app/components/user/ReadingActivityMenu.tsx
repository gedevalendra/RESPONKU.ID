"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Reading = { articleSlug: string; progress: number; anchorText?: string; updatedAt: string; article: { slug: string; title: string; thumbnailUrl: string } };
type Tab = "continue" | "history" | "liked" | "comments";

const details: Record<Tab, { label: string; icon: string; description: string }> = {
  continue: { label: "Lanjut baca", icon: "bx-book-open", description: "Bacaan belum selesai" },
  history: { label: "Riwayat", icon: "bx-history", description: "Semua artikel yang dibaca" },
  liked: { label: "Disukai", icon: "bx-heart", description: "Artikel yang Anda sukai" },
  comments: { label: "Komentar", icon: "bx-message-square-detail", description: "Komentar Anda" },
};

export default function ReadingActivityMenu({ readingHistory }: { readingHistory: Reading[] }) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [newest, setNewest] = useState(true);
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = (value: Tab) => { setClosing(false); setTab(value); dialog.current?.showModal(); };
  const close = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { dialog.current?.close(); return; }
    setClosing(true);
  };
  const finishClose = () => { if (closing) { dialog.current?.close(); setClosing(false); } };
  const items = useMemo(() => {
    const list = tab === "continue" ? readingHistory.filter((item) => item.progress < .96) : tab === "history" ? readingHistory : [];
    return [...list].sort((a, b) => newest ? +new Date(b.updatedAt) - +new Date(a.updatedAt) : +new Date(a.updatedAt) - +new Date(b.updatedAt));
  }, [readingHistory, newest, tab]);
  return <>
    <section className="grid grid-cols-2 md:grid-cols-4 gap-1" aria-label="Aktivitas akun">
      {(Object.keys(details) as Tab[]).slice(0, 4).map((key) => <button key={key} type="button" onClick={() => open(key)} className="group min-h-28 rounded-xl border border-rule bg-paper p-2 text-center sm:p-4 sm:text-left"><i className={`bx ${details[key].icon} text-xl text-gray-800 sm:text-2xl`} aria-hidden="true" /><p className="mt-3 text-xs font-medium sm:text-sm">{details[key].label}</p><p className="mt-1 hidden text-xs leading-4 text-mute sm:block">{key === "continue" ? `${readingHistory.filter((item) => item.progress < .96).length} belum selesai` : details[key].description}</p></button>)}
    </section>
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} onAnimationEnd={finishClose} className={`${closing ? "activity-sheet-closing" : "activity-sheet"} fixed inset-x-0 top-auto bottom-0 m-0 h-[80dvh] max-h-[80dvh] w-full max-w-none rounded-t-3xl bg-paper p-0 shadow-2xl backdrop:bg-black/40`}>
      {tab && <section className="flex h-full flex-col" aria-labelledby="reading-sheet-title"><header className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-5 py-4 sm:px-8"><div><p className="eyebrow">Aktivitas akun</p><h2 id="reading-sheet-title" className="mt-1 font-display text-2xl">{details[tab].label}</h2></div><button type="button" onClick={close} aria-label="Tutup" className="grid size-10 place-items-center rounded-full hover:bg-gray-100"><i className="bx bx-x text-2xl" /></button></header><div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-4 sm:px-8"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-mute">{tab === "continue" ? "Lanjutkan dari titik baca terakhir." : tab === "history" ? "Urutkan berdasarkan aktivitas membaca." : "Aktivitas ini akan muncul setelah Anda berinteraksi dengan artikel."}</p>{(tab === "continue" || tab === "history") && <button type="button" onClick={() => setNewest((value) => !value)} className="shrink-0 text-xs font-medium text-blue-700 underline underline-offset-4">{newest ? "Terbaru" : "Terlama"} <i className="bx bx-sort" /></button>}</div><div className="min-h-0 flex-1 overflow-y-auto divide-y divide-rule">{items.length ? items.map((item) => <Link key={item.articleSlug} href={`/artikel/${encodeURIComponent(item.article.slug)}`} onClick={close} className="flex gap-3 py-4 hover:bg-gray-50"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{item.article.title}</p><p className="mt-1 text-xs text-mute">{Math.floor(item.progress * 100)}% dibaca · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.updatedAt))}</p>{item.anchorText && <p className="mt-1 line-clamp-1 text-xs text-mute">“{item.anchorText}”</p>}</div>{item.article.thumbnailUrl && <img src={item.article.thumbnailUrl} alt="" className="size-14 shrink-0 object-cover" />}</Link>) : <p className="py-10 text-center text-sm text-mute">Belum ada aktivitas untuk ditampilkan.</p>}</div></div></section>}
    </dialog>
  </>;
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function ArticleReaderTools({ articleSlug, initialProgress, initialAnchorText }: { articleSlug: string; initialProgress: number; initialAnchorText: string }) {
  const [progress, setProgress] = useState(initialProgress);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(initialProgress);
  const [selection, setSelection] = useState<{ x: number; y: number; text: string; progress: number } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const content = document.getElementById("article-content");
    if (!content) return;
    const calculate = () => {
      const rect = content.getBoundingClientRect();
      const value = Math.max(0, Math.min(1, (window.innerHeight * 0.36 - rect.top) / Math.max(1, rect.height)));
      latest.current = value;
      setProgress(value);
    };
    const save = (anchorText?: string) => {
      if (latest.current < 0.01) return;
      void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/reading-progress`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress: latest.current, anchorText }), keepalive: true }).catch(() => null);
    };
    const saveOnExit = () => save();
    const saveSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim().replace(/\s+/g, " ") || "";
      if (text.length < 4 || !selection?.rangeCount || !content.contains(selection.anchorNode)) return;
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const selectedProgress = Math.max(0, Math.min(1, (rect.top - contentRect.top) / Math.max(1, content.offsetHeight)));
      setSelection({ x: Math.min(window.innerWidth - 210, Math.max(12, rect.left)), y: Math.max(12, rect.top - 46), text: text.slice(0, 120), progress: selectedProgress });
    };
    calculate();
    window.addEventListener("scroll", calculate, { passive: true });
    const saveTouchSelection = () => window.setTimeout(saveSelection, 180);
    document.addEventListener("mouseup", saveSelection);
    document.addEventListener("touchend", saveTouchSelection);
    window.addEventListener("pagehide", saveOnExit);
    const interval = window.setInterval(save, 8_000);
    return () => { window.removeEventListener("scroll", calculate); document.removeEventListener("mouseup", saveSelection); document.removeEventListener("touchend", saveTouchSelection); window.removeEventListener("pagehide", saveOnExit); window.clearInterval(interval); save(); };
  }, [articleSlug]);

  const resume = () => {
    const content = document.getElementById("article-content");
    if (!content) return;
    const target = content.getBoundingClientRect().top + window.scrollY + content.offsetHeight * initialProgress - window.innerHeight * 0.36;
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  const createSummary = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/summary`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ringkasan belum dapat dibuat.");
      setSummary(data.summary);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ringkasan belum dapat dibuat."); }
    finally { setLoading(false); }
  };

  const saveSelectedPoint = () => {
    if (!selection) return;
    latest.current = selection.progress;
    setProgress(selection.progress);
    void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/reading-progress`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress: selection.progress, anchorText: selection.text }) }).catch(() => null);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  return <><aside className="my-7 flex flex-wrap items-center justify-between gap-3 border-y border-rule bg-gray-50/70 px-4 py-3" aria-label="Alat membaca artikel">
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-medium"><i className="bx bx-book-reader text-lg text-blue-600" aria-hidden="true" />Progres membaca <span className="text-mute">{Math.round(progress * 100)}%</span></p>
      {initialProgress >= 0.05 && <button type="button" onClick={resume} className="mt-1 text-xs text-blue-700 underline underline-offset-4">Lanjutkan dari {Math.floor(initialProgress * 100)}%{initialAnchorText ? " · titik tersimpan" : ""}</button>}
    </div>
    <button type="button" onClick={createSummary} disabled={loading} className="mt-3 inline-flex min-h-9 items-center gap-2 border border-rule bg-white px-3 text-xs font-medium transition-colors hover:border-ink disabled:cursor-wait disabled:opacity-60 sm:mt-0"><i className="bx bx-sparkles text-base text-blue-600" aria-hidden="true" />{loading ? "Merangkum…" : "Inti berita"}</button>
    {(summary || error) && <div className="w-full border-t border-rule pt-3 text-sm leading-6"><p className="font-medium">Inti berita</p><p className={error ? "mt-1 text-red-700" : "mt-1 whitespace-pre-line text-mute"}>{error || summary}</p></div>}
  </aside>{selection && <><div className="fixed z-[110] hidden items-center gap-1 rounded-lg border border-gray-700 bg-ink p-1 shadow-xl sm:flex" style={{ left: selection.x, top: selection.y }} role="toolbar" aria-label="Aksi teks dipilih"><button type="button" onClick={saveSelectedPoint} className="inline-flex min-h-8 items-center gap-1.5 rounded px-2 text-xs font-medium text-white hover:bg-white/15"><i className="bx bx-bookmark-plus text-base" aria-hidden="true" />Tandai titik baca</button></div><div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[110] flex justify-center sm:hidden"><button type="button" onClick={saveSelectedPoint} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white shadow-xl active:scale-95"><i className="bx bx-bookmark-plus text-lg" aria-hidden="true" />Tandai titik baca</button></div></>}{savedNotice && <span role="status" className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-ink px-3 py-1.5 text-xs text-white shadow-lg">Titik baca disimpan</span>}</>;
}

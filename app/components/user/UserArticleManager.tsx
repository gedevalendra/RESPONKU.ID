"use client";
import { Rows, Skeleton } from "@/app/components/loading/PageSkeleton";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useRef, useState } from "react";
import type { Article } from "@/lib/types";
import ArticleComposer from "@/app/components/article/ArticleComposer";

const statusStyle: Record<string, { label: string; icon: string; badge: string }> = {
  published: { label: "Terbit", icon: "bx-check-circle", badge: "bg-green-50 text-green-700 ring-green-200" },
  pending: { label: "Menunggu review", icon: "bx-time-five", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  rejected: { label: "Ditolak", icon: "bx-x-circle", badge: "bg-red-50 text-red-700 ring-red-200" },
  draft: { label: "Draf", icon: "bx-edit", badge: "bg-gray-100 text-gray-700 ring-gray-200" },
};
const fallbackStyle = { icon: "bx-file", badge: "bg-gray-100 text-gray-700 ring-gray-200" };

export default function UserArticleManager({
  authorName,
}: {
  authorName: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const composer = useRef<HTMLDivElement>(null);

  async function load() {
    const response = await fetch("/api/user/articles", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setArticles(data.articles || []);
    else setMessage(data.error || "Artikel gagal dimuat.");
  }
  useEffect(() => {
    void load().catch(() => setMessage("Artikel gagal dimuat.")).finally(() => setInitialLoading(false));
  }, []);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("edit");
    if (requested) {
      const article = articles.find((item) => item.id === requested);
      if (article) setEditing(article);
    }
  }, [articles]);

  function edit(article: Article) {
    setEditing(article);
    // Composer ada di atas daftar: bawa pengguna ke sana agar jelas bahwa mode edit aktif
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => composer.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }
  async function remove(id: string) {
    if (!await confirmAction("Hapus artikel ini?", "Hapus")) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/user/articles/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setMessage("Artikel dihapus.");
        await load();
      } else {
        const data = await response.json();
        setMessage(data.error || "Artikel gagal dihapus.");
      }
    } finally {
      setDeleting(null);
    }
  }
  function saved(nextMessage: string) {
    setEditing(null);
    setMessage(nextMessage);
    void load();
  }

  return (
    <div className="space-y-12">
      <div ref={composer} className="scroll-mt-6">
        <ArticleComposer
          article={editing}
          authorName={authorName}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      </div>
      {message && <PopupStatus message={message} />}
      <section className="mx-auto w-full max-w-5xl" aria-labelledby="my-articles-title">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div>
            <h2 id="my-articles-title" className="font-display text-display-md">Kiriman saya</h2>
            <p className="mt-1 text-sm text-mute">Riwayat pengajuan artikel Anda.</p>
          </div>
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium tabular-nums text-gray-700">{articles.length} artikel</span>
        </div>

        {initialLoading ? (
          <Skeleton><Rows actions /></Skeleton>
        ) : articles.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center">
            <div className="max-w-xs">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-gray-100 text-gray-500"><i className="bx bx-file text-2xl" aria-hidden="true" /></span>
              <p className="mt-4 text-sm font-medium">Belum ada artikel</p>
              <p className="mt-1 text-sm text-mute">Tulis artikel pertama Anda di formulir di atas. Statusnya akan muncul di sini.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((article) => {
              const style = article.status ? statusStyle[article.status] : undefined;
              const isEditing = editing?.id === article.id;
              const isDeleting = deleting === article.id;
              return (
                <li key={article.id}>
                  <article className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-paper p-4 transition sm:p-5 ${isEditing ? "border-blue-500 ring-2 ring-blue-100" : "border-rule hover:border-gray-300"} ${isDeleting ? "opacity-50" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${(style ?? fallbackStyle).badge}`}>
                        <i className={`bx ${(style ?? fallbackStyle).icon}`} aria-hidden="true" />
                        {style?.label ?? article.status}
                      </span>
                      <h3 className="mt-2 break-words font-display text-lg leading-snug sm:text-xl">{article.title}</h3>
                      {article.rejectionReason ? (
                        <p className="mt-2 flex gap-2 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">
                          <i className="bx bx-message-error mt-0.5 shrink-0 text-base" aria-hidden="true" />
                          <span><span className="font-medium">Alasan penolakan:</span> {article.rejectionReason}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-mute">
                          {article.status === "published" ? "Artikel telah terbit." : "Menunggu pemeriksaan redaksi."}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => edit(article)}
                        disabled={isDeleting}
                        aria-label={`Edit ${article.title}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3.5 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        <i className="bx bx-edit-alt" aria-hidden="true" />Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(article.id)}
                        disabled={isDeleting}
                        aria-label={`Hapus ${article.title}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3.5 py-2 text-sm font-medium text-gray-800 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <i className={`bx ${isDeleting ? "bx-loader-alt motion-safe:animate-spin" : "bx-trash"}`} aria-hidden="true" />Hapus
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
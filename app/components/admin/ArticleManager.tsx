"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useMemo, useState } from "react";
import ArticleBody from "@/app/components/article/ArticleBody";
import { formatDate } from "@/lib/content";
import type { Article } from "@/lib/types";

type Filter = "all" | NonNullable<Article["status"]>;

export default function ArticleManager({
  superadminView = false,
}: {
  superadminView?: boolean;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [message, setMessage] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/articles", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setArticles(data.articles || []);
    else setMessage(data.error || "Artikel gagal dimuat.");
  }
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(
    () =>
      filter === "all"
        ? articles
        : articles.filter((article) => article.status === filter),
    [articles, filter],
  );
  const selectedArticle = selectedArticleId
    ? articles.find((article) => article.id === selectedArticleId)
    : null;
  const count = (status: NonNullable<Article["status"]>) =>
    articles.filter((article) => article.status === status).length;
  async function updateStatus(
    article: Article,
    status: NonNullable<Article["status"]>,
    rejectionReason?: string,
  ) {
    setMessage("");
    const response = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Status artikel gagal diubah.");
      return;
    }
    setMessage(
      status === "published"
        ? "Artikel disetujui dan diterbitkan."
        : "Artikel ditolak dan dikembalikan ke penulis.",
    );
    await load();
  }
  async function reject(article: Article) {
    const reason = window.prompt(
      "Alasan penolakan artikel:",
      article.rejectionReason ||
        "Mohon perbaiki naskah sesuai catatan redaksi.",
    );
    if (reason !== null)
      await updateStatus(
        article,
        "rejected",
        reason.trim() || "Perlu perbaikan editorial.",
      );
  }
  async function remove(id: string) {
    if (!await confirmAction("Hapus artikel ini secara permanen?", "Hapus")) return;
    const response = await fetch(`/api/admin/articles/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setMessage("Artikel dihapus.");
      await load();
    } else setMessage("Artikel gagal dihapus.");
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-4">
        {(["all", "pending", "published", "rejected"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`p-4 text-left shadow-sm transition-colors ${filter === item ? "bg-blue-500 text-white" : "bg-white text-gray-800 hover:bg-blue-50"}`}
          >
            <span className="eyebrow">{item === "all" ? "Semua" : item}</span>
            <strong className="mt-2 block font-display text-3xl">
              {item === "all" ? articles.length : count(item)}
            </strong>
          </button>
        ))}
      </div>
      {message && <PopupStatus message={message} />}
      <section>
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <div>
            <h2 className="font-display text-display-md">Approval editorial</h2>
            <p className="mt-1 text-sm text-mute">
              Tinjau dan putuskan status artikel yang masuk.
            </p>
          </div>
          <span className="eyebrow">{visible.length} item</span>
        </div>
        <div className="divide-y divide-rule">
          {visible.length === 0 ? (
            <p className="py-8 text-sm text-mute">
              Tidak ada artikel pada filter ini.
            </p>
          ) : (
            visible.map((article) => (
              <article key={article.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">
                      {article.status} · {article.category}
                    </p>
                    <h3 className="mt-1 font-display text-xl">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-sm text-mute">
                      {article.author} · {article.views} views
                    </p>
                    {article.rejectionReason && (
                      <p className="mt-2 text-sm text-signal">
                        Catatan: {article.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedArticleId(article.id)}
                      className="px-3 py-2 text-gray-800 hover:text-blue-500"
                    >
                      Lihat detail
                    </button>
                    {!superadminView && (
                      <button
                        type="button"
                        onClick={() => void remove(article.id)}
                        className="px-3 py-2 text-gray-800 hover:text-blue-500"
                      >
                        Hapus
                      </button>
                    )}
                    {article.status !== "published" && (
                      <button
                        type="button"
                        onClick={() =>
                          void updateStatus(article, "published")
                        }
                        className="bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                      >
                        Approve
                      </button>
                    )}
                    {article.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => void reject(article)}
                        className="px-3 py-2 text-blue-500 hover:text-blue-700"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      {selectedArticle && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-gray-800/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${selectedArticle.title}`}
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden bg-paper shadow-2xl">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4 sm:px-8">
              <div>
                <p className="eyebrow text-accent">Live review</p>
                <p className="mt-1 font-mono text-xs text-mute">
                  Preview artikel sebelum keputusan editorial
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticleId(null)}
                className="font-mono text-xs uppercase tracking-widest2 text-mute hover:text-ink"
                aria-label="Tutup preview"
              >
                Tutup ×
              </button>
            </div>
            <article className="overflow-y-auto px-5 py-7 sm:px-10 sm:py-10">
              <p className="eyebrow text-accent">
                {selectedArticle.status} · {selectedArticle.category}
              </p>
              <h2 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
                {selectedArticle.title}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mute">
                {selectedArticle.dek}
              </p>
              <p className="mt-5 border-b border-rule pb-6 font-mono text-[11px] text-mute">
                Oleh {selectedArticle.author} · {formatDate(selectedArticle.date)}
                {" · "}
                {selectedArticle.readTime} menit baca
              </p>
              {selectedArticle.thumbnailUrl && (
                <img
                  src={selectedArticle.thumbnailUrl}
                  alt={`Thumbnail: ${selectedArticle.title}`}
                  className="mt-8 aspect-[16/9] w-full object-cover"
                />
              )}
              <div className="mt-8 max-w-3xl">
                <ArticleBody
                  content={selectedArticle.content}
                  contentBlocks={selectedArticle.contentBlocks}
                />
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";
import ArticleComposer from "@/app/components/article/ArticleComposer";

export default function UserArticleManager({
  authorName,
}: {
  authorName: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | null>(null);
  const [message, setMessage] = useState("");
  async function load() {
    const response = await fetch("/api/user/articles", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setArticles(data.articles || []);
    else setMessage(data.error || "Artikel gagal dimuat.");
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("edit");
    if (requested) {
      const article = articles.find((item) => item.id === requested);
      if (article) setEditing(article);
    }
  }, [articles]);
  async function remove(id: string) {
    if (!await confirmAction("Hapus artikel ini?", "Hapus")) return;
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
  }
  function saved(nextMessage: string) {
    setEditing(null);
    setMessage(nextMessage);
    void load();
  }
  return (
    <div className="space-y-12">
      <ArticleComposer
        article={editing}
        authorName={authorName}
        onSaved={saved}
        onCancel={() => setEditing(null)}
      />
      {message && <PopupStatus message={message} />}
      <section>
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <div>
            <p className="eyebrow">Riwayat pengajuan</p>
            <h2 className="mt-1 font-display text-display-md">Kiriman saya</h2>
          </div>
          <span className="eyebrow">{articles.length} artikel</span>
        </div>
        <div className="divide-y divide-rule">
          {articles.length === 0 ? (
            <p className="py-8 text-sm text-mute">
              Belum ada artikel yang dibuat.
            </p>
          ) : (
            articles.map((article) => (
              <article
                key={article.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="eyebrow">{article.status}</p>
                  <h3 className="mt-1 font-display text-xl">{article.title}</h3>
                  <p className="mt-1 text-sm text-mute">
                    {article.rejectionReason ||
                      (article.status === "published"
                        ? "Artikel telah terbit."
                        : "Menunggu pemeriksaan redaksi.")}
                  </p>
                </div>
                <div className="flex gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setEditing(article)}
                    className="text-gray-800 hover:text-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(article.id)}
                    className="text-gray-800 hover:text-blue-500"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

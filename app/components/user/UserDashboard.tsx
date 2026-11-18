"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/types";

export default function UserDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [message, setMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    fetch("/api/user/articles").then(async (response) => {
      const data = await response.json();
      if (response.ok) setArticles(data.articles);
      else setMessage(data.error);
    });
  }, []);
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section id="riwayat" className="border-t border-ink pt-6 lg:col-span-3">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <h2 className="font-display text-display-md">Riwayat Publish</h2>
          <span className="eyebrow">{articles.length} artikel</span>
        </div>
        {message && (
          <PopupStatus message={message} />
        )}
        <div className="divide-y divide-rule">
          {articles.length === 0 && !message ? (
            <p className="py-6 text-sm text-mute">
              Belum ada artikel yang dibuat.
            </p>
          ) : (
            (showAll ? articles : articles.slice(0, 3)).map((article) => (
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
                        ? "Artikel telah diterbitkan."
                        : "Menunggu pemeriksaan redaksi.")}
                  </p>
                </div>
                <a
                  href={`/akun/artikel?edit=${article.id}`}
                  className="font-mono text-xs uppercase tracking-widest2 underline underline-offset-4"
                >
                  Kelola
                </a>
              </article>
            ))
          )}
        </div>
        {articles.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            aria-expanded={showAll}
            className="mt-4 w-full py-3 text-center text-sm font-medium text-blue-500 hover:bg-blue-50"
          >
            {showAll ? "Tampilkan lebih sedikit" : "Lihat lebih banyak"}
          </button>
        )}
      </section>
    </div>
  );
}

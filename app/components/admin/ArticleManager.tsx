"use client";
import { ApprovalContent } from "@/app/components/loading/AdminSkeletons";
import { Skeleton } from "@/app/components/loading/PageSkeleton";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useMemo, useRef, useState } from "react";
import ArticleBody from "@/app/components/article/ArticleBody";
import { formatDate } from "@/lib/content";
import type { Article } from "@/lib/types";

const filters = {
  all: "Semua",
  unanswered: "Belum direspons",
  published: "Diterima",
  rejected: "Ditolak",
} as const;
type Filter = keyof typeof filters;

function matchesFilter(article: Article, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "unanswered") return !article.status || article.status === "draft" || article.status === "pending";
  return article.status === filter;
}

export default function ArticleManager({
  superadminView = false,
}: {
  superadminView?: boolean;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [rejectionTargets, setRejectionTargets] = useState<Article[]>([]);
  const rejectionDialog = useRef<HTMLDialogElement>(null);

  async function load() {
    const response = await fetch("/api/admin/articles", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setArticles(data.articles || []);
    else setMessage(data.error || "Artikel gagal dimuat.");
  }
  useEffect(() => {
    void load().catch(() => setMessage("Artikel gagal dimuat.")).finally(() => setInitialLoading(false));
  }, []);
  const visible = useMemo(
    () =>
      articles.filter((article) => matchesFilter(article, filter)),
    [articles, filter],
  );
  const selectedArticle = selectedArticleId
    ? articles.find((article) => article.id === selectedArticleId)
    : null;
  const selected = visible.filter((article) => selectedIds.includes(article.id));
  const allSelected = visible.length > 0 && selected.length === visible.length;
  const canApprove = selected.filter((article) => article.status !== "published");
  const canReject = selected.filter((article) => article.status !== "rejected");

  async function applyBulk(targets: Article[], status: "published" | "rejected", rejectionReason?: string) {
    setBulkBusy(true);
    setMessage("");
    const updated: Article[] = [];
    try {
      for (const article of targets) {
        try {
          const response = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, rejectionReason }),
          });
          if (response.ok) updated.push((await response.json()).article);
        } catch {
          // Keep failed entries selected so the editor can retry them.
        }
      }
      const byId = new Map(updated.map((article) => [article.id, article]));
      setArticles((current) => current.map((article) => byId.get(article.id) ?? article));
      setSelectedIds((current) => current.filter((id) => !byId.has(id)));
      const failed = targets.length - updated.length;
      setMessage(`${updated.length} artikel berhasil ${status === "published" ? "diterbitkan" : "ditolak"}.${failed ? ` ${failed} gagal diproses dan masih dipilih.` : ""}`);
    } finally {
      setBulkBusy(false);
    }
  }
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
  function openRejection(targets: Article[]) {
    setRejectionTargets(targets);
    setReason(targets.length === 1 ? targets[0].rejectionReason ?? "" : "");
    rejectionDialog.current?.showModal();
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

  if (initialLoading) return <Skeleton><ApprovalContent /></Skeleton>;

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(filters) as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            disabled={bulkBusy}
            aria-pressed={filter === item}
            onClick={() => { setFilter(item); setSelectedIds([]); }}
            className={`p-4 text-left shadow-sm transition-colors ${filter === item ? "bg-blue-500 text-white" : "bg-white text-gray-800 hover:bg-blue-50"}`}
          >
            <span className={`font-mono text-xs uppercase tracking-widest ${filter === item ? "font-semibold" : "text-mute"}`}>
              {filters[item]}
            </span>
            <strong className="mt-2 block font-display text-3xl">
              {articles.filter((article) => matchesFilter(article, item)).length}
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
        {visible.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-rule py-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allSelected} disabled={bulkBusy}
                ref={(input) => { if (input) input.indeterminate = selected.length > 0 && !allSelected; }}
                onChange={() => setSelectedIds(allSelected ? [] : visible.map((article) => article.id))} />
              Pilih semua di filter ini
            </label>
            {selected.length > 0 && <span className="text-mute">{selected.length} dipilih</span>}
            {!!canApprove.length && <button type="button" disabled={bulkBusy}
              className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
              onClick={async () => {
                if (await confirmAction(`Terbitkan ${canApprove.length} artikel terpilih?`, "Terbitkan")) {
                  await applyBulk(canApprove, "published");
                }
              }}>Terbitkan terpilih</button>}
            {!!canReject.length && <button type="button" disabled={bulkBusy}
              className="rounded-lg border border-rule px-3 py-2 disabled:opacity-50"
              onClick={() => openRejection(canReject)}>Tolak terpilih</button>}
            {bulkBusy && <span role="status" className="text-mute">Memproses artikel…</span>}
          </div>
        )}
        <div className="divide-y divide-rule">
          {visible.length === 0 ? (
            <p className="py-8 text-sm text-mute">
              Tidak ada artikel pada filter ini.
            </p>
          ) : (
            visible.map((article) => (
              <article key={article.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <input type="checkbox" aria-label={`Pilih ${article.title}`}
                      className="mt-1 self-start" checked={selectedIds.includes(article.id)} disabled={bulkBusy}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSelectedIds((current) => checked ? [...current, article.id] : current.filter((id) => id !== article.id));
                      }} />
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
                        disabled={bulkBusy}
                        onClick={() => void remove(article.id)}
                        className="px-3 py-2 text-gray-800 hover:text-blue-500"
                      >
                        Hapus
                      </button>
                    )}
                    {article.status !== "published" && (
                      <button
                        type="button"
                        disabled={bulkBusy}
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
                        disabled={bulkBusy}
                        onClick={() => openRejection([article])}
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
      <dialog ref={rejectionDialog} aria-labelledby="reject-selected-title"
        className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40">
        <h2 id="reject-selected-title" className="text-lg font-semibold">Tolak {rejectionTargets.length} artikel?</h2>
        {rejectionTargets.length === 1 && <p className="mt-2 break-words text-sm text-mute">{rejectionTargets[0].title}</p>}
        <form className="mt-4 grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (!reason.trim() || bulkBusy || !rejectionTargets.length) return;
          rejectionDialog.current?.close();
          void applyBulk(rejectionTargets, "rejected", reason.trim());
        }}>
          <label className="grid gap-2 text-sm">
            {rejectionTargets.length === 1 ? "Alasan penolakan" : "Catatan penolakan untuk semua artikel terpilih"}
            <textarea required maxLength={500} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tulis catatan untuk penulis…" className="rounded border border-rule p-3" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => rejectionDialog.current?.close()} className="rounded border border-rule px-4 py-2">Batal</button>
            <button disabled={!reason.trim()} className="rounded bg-ink px-4 py-2 text-paper disabled:opacity-50">Tolak artikel</button>
          </div>
        </form>
      </dialog>
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
                className="popup-close font-mono text-xs uppercase tracking-widest2 text-mute hover:text-ink"
                aria-label="Tutup preview"
              >
                Tutup ×
              </button>
            </div>
            <article className="min-h-0 overflow-y-auto overscroll-contain px-5 py-7 sm:px-10 sm:py-10">
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

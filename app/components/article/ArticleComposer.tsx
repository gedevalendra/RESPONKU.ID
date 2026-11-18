"use client";

import BrandLogo from "@/app/components/layout/BrandLogo";
import { PopupStatus, confirmAction } from "@/app/components/layout/ActionFeedback";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Article, ArticleBlock, Category } from "@/lib/types";
import ArticleBody from "./ArticleBody";

type ArticleDraft = {
  title: string;
  dek: string;
  thumbnailUrl: string;
  category: Category;
  author: string;
  readTime: number;
  blocks: ArticleBlock[];
};
type Props = {
  article?: Article | null;
  authorName: string;
  onSaved: (message: string) => void;
  onCancel?: () => void;
};
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function legacyBlocks(article?: Article | null): ArticleBlock[] {
  if (article?.contentBlocks?.length) return article.contentBlocks;
  if (article?.content?.length)
    return article.content.map((text, index) => ({
      id: `legacy-${index}`,
      type: "text",
      text,
    }));
  return [{ id: id(), type: "text", text: "" }];
}
function initial(article: Article | null | undefined, authorName: string): ArticleDraft {
  return {
    title: article?.title || "",
    dek: article?.dek || "",
    thumbnailUrl: article?.thumbnailUrl || "",
    category: article?.category || "Ekonomi",
    author: authorName,
    readTime: article?.readTime || 5,
    blocks: legacyBlocks(article),
  };
}

export async function convertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung konversi foto");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.86, 0.74, 0.62, 0.5, 0.38]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.size <= MAX_IMAGE_BYTES) return blob;
  }
  throw new Error("Foto masih lebih besar dari 2 MB setelah dikonversi");
}

export default function ArticleComposer({
  article,
  authorName,
  onSaved,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState<ArticleDraft>(() =>
    initial(article, authorName),
  );
  const [busy, setBusy] = useState(false);
  const [submission, setSubmission] = useState<Pick<Article, "status" | "slug"> | null>(null);
  const progressPanel = useRef<HTMLElement>(null);
  const showProgress = busy || submission !== null;
  useEffect(() => {
    if (showProgress) progressPanel.current?.scrollIntoView({ block: "start" });
  }, [showProgress]);
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("Kategori dan durasi baca ditentukan otomatis dari isi artikel.");
  const analysisText = draft.blocks.map((block) => "text" in block ? block.text : block.type === "image" ? block.caption || "" : "").join("\n");
  useEffect(() => {
    if (analysisText.trim().length < 80) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAnalysisMessage("Menganalisis kategori dan durasi baca…");
      try {
        const response = await fetch("/api/ai/article-analysis", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft.title, dek: draft.dek, content: [analysisText.slice(0, 20000)] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) {
          setDraft((current) => ({ ...current, category: data.category, readTime: data.readTime }));
          setAnalysisMessage("Kategori dan durasi baca diperbarui otomatis.");
        }
      } catch (error) {
        if (!controller.signal.aborted) setAnalysisMessage(error instanceof Error ? error.message : "Analisis belum tersedia.");
      }
    }, 2500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [analysisText, draft.title, draft.dek]);
  useEffect(() => {
    setDraft(initial(article, authorName));
  }, [article, authorName]);
  const textContent = useMemo(
    () =>
      draft.blocks
        .filter(
          (block): block is Extract<ArticleBlock, { type: "text" }> =>
            block.type === "text",
        )
        .map((block) => block.text.trim())
        .filter(Boolean),
    [draft.blocks],
  );
  function update<K extends keyof ArticleDraft>(
    key: K,
    value: ArticleDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateBlock(blockId: string, patch: Partial<ArticleBlock>) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? ({ ...block, ...patch } as ArticleBlock) : block,
      ),
    }));
  }
  function add(type: ArticleBlock["type"]) {
    const next: ArticleBlock =
      type === "image"
        ? { id: id(), type, url: "", alt: "", caption: "" }
        : type === "divider"
          ? { id: id(), type }
          : type === "quote"
            ? { id: id(), type, text: "", attribution: "" }
            : { id: id(), type, text: "" };
    setDraft((current) => ({ ...current, blocks: [...current.blocks, next] }));
  }
  function remove(blockId: string) {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }));
  }
  function move(blockId: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.blocks.findIndex((block) => block.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.blocks.length)
        return current;
      const blocks = [...current.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  }
  async function uploadImage(blockId: string, file?: File) {
    if (!file) return;
    setError("");
    setImageBusy(blockId);
    try {
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append(
        "file",
        new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
          type: "image/webp",
        }),
      );
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Foto gagal diupload");
      updateBlock(blockId, {
        url: data.url,
        alt: file.name.replace(/\.[^.]+$/, ""),
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Foto gagal diupload",
      );
    } finally {
      setImageBusy(null);
    }
  }
  async function uploadThumbnail(file?: File) {
    if (!file) return;
    setError("");
    setThumbnailBusy(true);
    try {
      const blob = await convertToWebp(file);
      const form = new FormData();
      form.append(
        "file",
        new File([blob], "thumbnail.webp", { type: "image/webp" }),
      );
      form.append("kind", "thumbnail");
      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Thumbnail gagal diupload");
      update("thumbnailUrl", data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Thumbnail gagal diupload",
      );
    } finally {
      setThumbnailBusy(false);
    }
  }
  async function generateCaption(
    block: Extract<ArticleBlock, { type: "image" }>,
  ) {
    if (!block.url) {
      setError("Upload foto terlebih dahulu untuk membuat caption AI.");
      return;
    }
    setError("");
    setImageBusy(block.id);
    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: block.url }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Caption AI gagal dibuat");
      updateBlock(block.id, { caption: data.caption });
    } catch (captionError) {
      setError(
        captionError instanceof Error
          ? captionError.message
          : "Caption AI gagal dibuat",
      );
    } finally {
      setImageBusy(null);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (
      draft.blocks.length === 0 ||
      draft.blocks.every(
        (block) =>
          block.type === "divider" || ("text" in block && !block.text.trim()),
      )
    ) {
      setError("Tambahkan minimal satu blok isi artikel.");
      return;
    }
    if (!draft.thumbnailUrl) {
      setError("Upload thumbnail utama terlebih dahulu.");
      return;
    }
    if (
      draft.blocks.some((block) => block.type === "image" && !block.url.trim())
    ) {
      setError("Lengkapi URL atau upload foto pada setiap blok foto.");
      return;
    }
    if (!(await confirmAction("Kirim artikel untuk diperiksa?", "Kirim"))) return;
    setBusy(true);
    const payload = {
      title: draft.title,
      dek: draft.dek,
      thumbnailUrl: draft.thumbnailUrl,
      category: draft.category,
      author: draft.author,
      readTime: Number(draft.readTime),
      contentBlocks: draft.blocks,
      content: textContent,
    };
    try {
    const response = await fetch(
      article ? `/api/user/articles/${article.id}` : "/api/user/articles",
      {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Artikel gagal disimpan.");
      return;
    }
    setSubmission({ status: data.article.status, slug: data.article.slug });
    } catch {
      setError("Status kiriman tidak dapat dikonfirmasi. Periksa Kiriman saya sebelum mencoba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (showProgress) {
    const published = submission?.status === "published";
    const rejected = submission?.status === "rejected";
    const headline = busy ? "Artikel sedang dikirim…" : published ? "Artikel diterbitkan" : rejected ? "Artikel tidak disetujui" : "Artikel dikirim untuk ditinjau";
    return (
      <section ref={progressPanel} className="action-popup scroll-mt-40 border-y border-rule bg-paper px-5 py-12 sm:py-20">
        <div role="status" className="mx-auto grid max-w-md justify-items-center gap-4 text-center">
          <div className="grid size-16 place-items-center border border-rule text-3xl text-ink" aria-hidden="true">
            <i className={`bx ${busy ? "bx-loader-alt motion-safe:animate-spin" : published ? "bx-check" : rejected ? "bx-info-circle" : "bx-paper-plane"}`} />
          </div>
          <h2 className="font-display text-3xl">{headline}</h2>
          <p className="text-sm leading-6 text-mute">
            {busy ? "Artikel sedang diproses. Hasilnya akan tampil di sini."
              : published ? <>Artikelmu sudah bisa dibaca di <BrandLogo />.</>
              : rejected ? "Lihat riwayat pengajuan untuk memeriksa status artikel."
              : "Pantau hasil review di Kiriman saya."}
          </p>
        </div>
        {!busy && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="min-h-11 border border-rule px-4 text-sm hover:bg-gray-100" onClick={() => {
              setDraft(initial(null, authorName));
              setSubmission(null);
              onSaved(headline);
            }}>Kembali ke kiriman</button>
            {published && submission?.slug && (
              <Link className="inline-flex min-h-11 items-center bg-ink px-4 text-sm text-paper" href={`/artikel/${encodeURIComponent(submission.slug)}`}>
                Lihat artikel
              </Link>
            )}
          </div>
        )}
      </section>
    );
  }
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        onSubmit={submit}
        className="space-y-5 bg-white p-5 shadow-sm sm:p-7"
      >
        <div>
          <p className="eyebrow">
            {article ? "Edit kiriman" : "Editor artikel"}
          </p>
          <h2 className="mt-1 font-display text-2xl">Susun berita kamu</h2>
          <p className="mt-2 text-sm text-mute">
            Tambahkan bagian teks, foto, kutipan, dan judul sesuai alur cerita.
          </p>
        </div>
        <div className="grid gap-3">
          <input
            required
            minLength={5}
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Judul artikel"
            className="px-3 py-3 text-sm"
          />
          <textarea
            required
            minLength={10}
            value={draft.dek}
            onChange={(event) => update("dek", event.target.value)}
            placeholder="Ringkasan / dek"
            className="min-h-24 px-3 py-3 text-sm"
          />
          <label className="grid gap-2 bg-blue-50 p-4">
            <span className="eyebrow text-blue-600">Thumbnail utama · wajib</span>
            <span className="text-sm text-gray-600">
              Foto ini akan tampil di bawah judul artikel dan maksimal 2 MB.
            </span>
            <input
              type="file"
              required={!draft.thumbnailUrl}
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                void uploadThumbnail(event.target.files?.[0])
              }
              className="px-3 py-3 text-sm"
            />
            {thumbnailBusy && (
              <span className="font-mono text-xs text-mute">
                Mengolah thumbnail...
              </span>
            )}
            {draft.thumbnailUrl && (
              <img
                src={draft.thumbnailUrl}
                alt="Preview thumbnail utama"
                className="max-h-56 w-full object-cover"
              />
            )}
          </label>
          <div className="grid gap-3">
            <input
              required
              value={draft.author}
              readOnly
              aria-readonly="true"
              className="cursor-not-allowed px-3 py-3 text-sm text-mute"
            />
          </div>
          <p role="status" className="text-xs text-mute">{analysisMessage}</p>
        </div>
        <div className="space-y-3">
          {draft.blocks.map((block, index) => (
            <div key={block.id} className="bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">
                  Bagian {index + 1} · {block.type}
                </span>
                <div className="flex gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => move(block.id, -1)}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-blue-500 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(block.id, 1)}
                    disabled={index === draft.blocks.length - 1}
                    className="text-gray-500 hover:text-blue-500 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(block.id)}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              {block.type === "text" && (
                <textarea
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(block.id, { text: event.target.value })
                  }
                  placeholder="Tulis paragraf berita..."
                  className="min-h-28 w-full px-3 py-3 text-sm"
                />
              )}
              {block.type === "heading" && (
                <input
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(block.id, { text: event.target.value })
                  }
                  placeholder="Judul bagian"
                  className="w-full px-3 py-3 text-sm"
                />
              )}
              {block.type === "image" && (
                <div className="grid gap-2">
                  <label className="flex cursor-pointer items-center justify-center bg-blue-50 px-3 py-3 font-mono text-xs text-blue-600 hover:bg-blue-100">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        void uploadImage(block.id, event.target.files?.[0])
                      }
                    />
                    {imageBusy === block.id
                      ? "Mengolah foto..."
                      : "Upload foto · otomatis WebP, maksimal 2 MB"}
                  </label>
                  <input
                    value={block.url}
                    onChange={(event) =>
                      updateBlock(block.id, { url: event.target.value })
                    }
                    placeholder="Atau masukkan URL foto (https://...)"
                    className="px-3 py-3 text-sm"
                  />
                  <input
                    value={block.alt}
                    onChange={(event) =>
                      updateBlock(block.id, { alt: event.target.value })
                    }
                    placeholder="Deskripsi foto / alt text"
                    className="px-3 py-3 text-sm"
                  />
                  <input
                    value={block.caption || ""}
                    onChange={(event) =>
                      updateBlock(block.id, { caption: event.target.value })
                    }
                    placeholder="Caption foto (opsional)"
                    className="px-3 py-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled={imageBusy === block.id || !block.url}
                    onClick={() => void generateCaption(block)}
                    className="w-fit bg-gray-800 px-3 py-2 font-mono text-xs text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {imageBusy === block.id
                      ? "Membuat caption..."
                      : "Generate caption with AI"}
                  </button>
                  {block.url && (
                    <img
                      src={block.url}
                      alt={block.alt}
                      className="max-h-48 w-full object-cover"
                    />
                  )}
                </div>
              )}
              {block.type === "quote" && (
                <div className="grid gap-2">
                  <textarea
                    value={block.text}
                    onChange={(event) =>
                      updateBlock(block.id, { text: event.target.value })
                    }
                    placeholder="Tulis kutipan..."
                    className="min-h-24 px-3 py-3 text-sm"
                  />
                  <input
                    value={block.attribution || ""}
                    onChange={(event) =>
                      updateBlock(block.id, { attribution: event.target.value })
                    }
                    placeholder="Sumber kutipan (opsional)"
                    className="px-3 py-3 text-sm"
                  />
                </div>
              )}
              {block.type === "divider" && (
                <p className="text-sm text-mute">Garis pemisah antarbagian.</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-full eyebrow">Tambah bagian</span>
          {(
            [
              ["text", "Teks"],
              ["heading", "Judul bagian"],
              ["image", "Foto"],
              ["quote", "Kutipan"],
              ["divider", "Pemisah"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="bg-blue-50 px-3 py-2 font-mono text-xs text-blue-600 transition-colors hover:bg-blue-500 hover:text-white"
            >
              + {label}
            </button>
          ))}
        </div>
        <PopupStatus message={error} />
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            className="bg-blue-500 px-5 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {busy
              ? "Mengirim..."
              : article
                ? "Ajukan ulang"
                : "Kirim untuk review"}
          </button>
          {article && onCancel && (
            <button
              type="button"
              onClick={async () => {
                if (await confirmAction("Batalkan pengeditan artikel?", "Batalkan edit")) onCancel();
              }}
              className="px-5 py-3 font-mono text-xs text-gray-800 hover:text-blue-500"
            >
              Batal edit
            </button>
          )}
        </div>
      </form>
      <aside className="min-w-0 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <span className="eyebrow">Live preview</span>
          <span className="font-mono text-[10px] text-blue-500">DRAFT</span>
        </div>
        <article>
          <p className="eyebrow">{draft.category}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-gray-800 sm:text-5xl">
            {draft.title || "Judul artikel kamu"}
          </h1>
          <p className="mt-5 text-lg text-mute">
            {draft.dek || "Ringkasan artikel akan tampil di sini."}
          </p>
          <p className="mt-5 font-mono text-[11px] text-mute">
            Oleh {draft.author || "Nama penulis"} · {draft.readTime} menit baca
          </p>
          {draft.thumbnailUrl && (
            <img
              src={draft.thumbnailUrl}
              alt="Thumbnail utama artikel"
              className="mt-8 aspect-[16/9] w-full object-cover"
            />
          )}
          <div className="mt-8">
            <ArticleBody content={textContent} contentBlocks={draft.blocks} />
          </div>
        </article>
      </aside>
    </div>
  );
}

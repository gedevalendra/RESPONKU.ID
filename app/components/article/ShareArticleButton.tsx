"use client";

import { useId, useRef, useState } from "react";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

type ShareArticleButtonProps = {
  slug: string;
  title: string;
  dek: string;
  author: string;
  publishedLabel: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
};

export default function ShareArticleButton({
  slug,
  title,
  dek,
  author,
  publishedLabel,
  imageUrl,
  likeCount,
  commentCount,
}: ShareArticleButtonProps) {
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [url, setUrl] = useState("");
  const [shareImageBusy, setShareImageBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const shareFile = useRef<File | null>(null);
  const titleId = useId();

  function recordShare() {
    void fetch(`/api/articles/${encodeURIComponent(slug)}/share`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }

  function openShare() {
    const articleUrl = new URL(`/artikel/${encodeURIComponent(slug)}`, window.location.origin).href;
    setUrl(articleUrl);
    setMessage("");
    setManualLink("");
    shareFile.current = null;
    dialog.current?.showModal();
    dialog.current?.focus({ preventScroll: true });
    void prepareShareImage();
  }

  function loadCanvasImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Gambar gagal dimuat"));
      image.src = src;
    });
  }

  function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
        if (lines.length === maxLines) break;
      }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
      let last = lines[maxLines - 1];
      while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last.trimEnd()}…`;
    }
    return lines;
  }

  async function createSharePoster() {
    await document.fonts?.ready;
    const width = 1080;
    const padding = 64;
    const scratch = document.createElement("canvas").getContext("2d");
    if (!scratch) throw new Error("Canvas tidak tersedia");
    scratch.font = "700 54px Georgia, serif";
    const titleLines = wrapCanvasText(scratch, title, width - padding * 2, 4);
    scratch.font = "400 30px Arial, sans-serif";
    const dekLines = wrapCanvasText(scratch, dek, width - padding * 2, 4);
    const imageHeight = imageUrl ? 536 : 0;
    const height = 190 + titleLines.length * 64 + 34 + dekLines.length * 43 + (imageUrl ? imageHeight + 42 : 18) + 230;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas tidak tersedia");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    let logo: HTMLImageElement | null = null;
    let thumbnail: HTMLImageElement | null = null;
    try { logo = await loadCanvasImage("/image/icon_black.svg"); } catch { /* fallback teks */ }
    if (imageUrl) {
      try { thumbnail = await loadCanvasImage(imageUrl); } catch { /* poster tetap dibuat tanpa gambar */ }
    }

    if (logo) context.drawImage(logo, padding, 42, 210, 56);
    else {
      context.fillStyle = "#1f2937";
      context.font = "700 32px Arial, sans-serif";
      context.fillText("ResponKu", padding, 82);
    }
    context.fillStyle = "#6b7280";
    context.font = "400 24px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(publishedLabel, width - padding, 80);
    context.textAlign = "left";

    context.fillStyle = "#6b7280";
    context.font = "600 23px Arial, sans-serif";
    context.fillText(author, padding, 142);

    let y = 202;
    context.fillStyle = "#1f2937";
    context.font = "700 54px Georgia, serif";
    for (const line of titleLines) {
      context.fillText(line, padding, y);
      y += 64;
    }
    y += 10;
    context.fillStyle = "#6b7280";
    context.font = "400 30px Arial, sans-serif";
    for (const line of dekLines) {
      context.fillText(line, padding, y);
      y += 43;
    }

    if (thumbnail) {
      y += 18;
      const targetWidth = width - padding * 2;
      const sourceRatio = thumbnail.width / thumbnail.height;
      const targetRatio = targetWidth / imageHeight;
      let sx = 0; let sy = 0; let sw = thumbnail.width; let sh = thumbnail.height;
      if (sourceRatio > targetRatio) {
        sw = thumbnail.height * targetRatio;
        sx = (thumbnail.width - sw) / 2;
      } else {
        sh = thumbnail.width / targetRatio;
        sy = (thumbnail.height - sh) / 2;
      }
      context.drawImage(thumbnail, sx, sy, sw, sh, padding, y, targetWidth, imageHeight);
      y += imageHeight + 42;
    } else {
      y += 28;
    }

    context.fillStyle = "#6b7280";
    context.font = "400 25px Arial, sans-serif";
    context.fillText(`♡  ${new Intl.NumberFormat("id-ID").format(likeCount)} suka`, padding, y);
    context.fillText(`▢  ${new Intl.NumberFormat("id-ID").format(commentCount)} komentar`, padding + 220, y);
    y += 46;
    context.strokeStyle = "#e5e7eb";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
    y += 62;
    context.fillStyle = "#1f2937";
    context.font = "700 34px Georgia, serif";
    context.fillText("Ikut berbagi cerita bersama ResponKu", padding, y);
    context.fillStyle = "#6b7280";
    context.font = "400 23px Arial, sans-serif";
    context.fillText("Baca, tulis, dan terhubung di responku.id", padding, y + 40);

    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Poster gagal dibuat")), "image/png", 0.95));
    return new File([blob], `responku-${slug}.png`, { type: "image/png" });
  }

  async function prepareShareImage() {
    setShareImageBusy(true);
    try {
      shareFile.current = await createSharePoster();
    } catch {
      shareFile.current = null;
    } finally {
      setShareImageBusy(false);
    }
  }

  async function getShareData(): Promise<ShareData> {
    if (typeof navigator.canShare !== "function") throw new Error("Berbagi file belum didukung");
    const file = shareFile.current || await createSharePoster();
    const mediaShareData: ShareData = { title, text: `${title}\n${url}`, files: [file] };
    if (!navigator.canShare(mediaShareData)) throw new Error("Berbagi file belum didukung");
    return mediaShareData;
  }

  async function share() {
    setMessage("");
    setManualLink("");

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(await getShareData());
        recordShare();
        dialog.current?.close();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage("Perangkat ini tidak mendukung berbagi gambar langsung. Poster akan diunduh.");
      }
    }
    try {
      const file = shareFile.current || await createSharePoster();
      const downloadUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = file.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setMessage("Poster lengkap diunduh. Unggah gambar tersebut ke aplikasi tujuan.");
    } catch {
      setMessage("Poster gagal dibuat. Silakan coba lagi.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      recordShare();
      setMessage("Tautan disalin");
    } catch {
      setManualLink(url);
      setMessage("Salin tautan artikel dari kolom ini.");
    }
  }

  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={openShare} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-rule px-3 text-sm font-medium text-ink hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2">
        <i className="bx bx-share-alt text-lg" aria-hidden="true" />
      </button>
      <dialog ref={dialog} tabIndex={-1} aria-labelledby={titleId} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">Bagikan artikel</h2>
          <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="popup-close grid size-10 place-items-center rounded-full hover:bg-gray-100">
            <i className="bx bx-x text-2xl" aria-hidden="true" />
          </button>
        </div>

        <section className="mt-5" aria-label="Pratinjau artikel yang dibagikan">
          <div className="flex items-center justify-between gap-4">
            <img src="/image/icon_black.svg" alt="ResponKu" className="h-8 w-24 shrink-0 object-contain object-left" />
            <time className="shrink-0 text-xs text-mute">{publishedLabel}</time>
          </div>

          <p className="mt-5 truncate text-xs font-semibold text-mute">{author}</p>
          <h3 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-mute sm:text-base">{dek}</p>

          {imageUrl && (
            <img src={imageUrl} alt={`Thumbnail ${title}`} className="mt-5 aspect-[16/9] w-full object-cover" />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mute">
            <span className="inline-flex items-center gap-1.5">
              <i className="bx bx-like text-lg" aria-hidden="true" />
              {new Intl.NumberFormat("id-ID").format(likeCount)} suka
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="bx bx-comment-detail text-lg" aria-hidden="true" />
              {new Intl.NumberFormat("id-ID").format(commentCount)} komentar
            </span>
          </div>

          <div className="mt-5 border-t border-rule pt-5">
            <p className="font-display text-xl font-semibold">Ikut berbagi cerita bersama ResponKu</p>
            <p className="mt-1 text-sm leading-6 text-mute">Baca, tulis, dan terhubung dalam ruang media digital yang terbuka untuk semua.</p>
            <a href="/masuk" className="mt-3 inline-flex min-h-10 items-center font-semibold text-ink underline decoration-gray-300 underline-offset-4 hover:decoration-ink">
              Bergabung ke ResponKu
            </a>
          </div>
        </section>

        <div className="mt-6 border-t border-rule pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest2 text-mute">Pilih cara membagikan</p>
          <div className="grid gap-2 text-sm font-medium sm:grid-cols-2">
          <button type="button" onClick={() => void copyLink()} className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-100 px-3 hover:bg-gray-200">
            <i className="bx bx-link text-xl" aria-hidden="true" /> Salin tautan
          </button>
          <button type="button" onClick={() => void share()} disabled={shareImageBusy} className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-800 px-3 text-white hover:bg-gray-700 disabled:opacity-50">
            <i className={`bx ${shareImageBusy ? "bx-loader-alt animate-spin" : "bx-share-alt"} text-xl`} aria-hidden="true" /> {shareImageBusy ? "Menyiapkan gambar…" : "Bagikan cara lain"}
          </button>
          </div>
        </div>
      <PopupStatus message={manualLink ? "" : message} />
      {manualLink && (
        <><p className="mt-2 text-xs text-mute">{message}</p>
        <input aria-label="Tautan artikel" readOnly value={manualLink}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 w-full rounded border border-rule px-2 py-1 text-sm" /></>
      )}
      </dialog>
    </>
  );
}

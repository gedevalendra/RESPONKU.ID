"use client";

import { useId, useRef, useState } from "react";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";
import { drawShareCard, type ShareCardData } from "./share-card";

export default function ShareArticleButton({ slug, ...data }: ShareCardData & { slug: string }) {
  const { title } = data;
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [url, setUrl] = useState("");
  const [nativeShare, setNativeShare] = useState(false);
  const [card, setCard] = useState<{ preview: string; file: File } | null>(null);
  const [story, setStory] = useState(false);
  const generation = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  function prepareCard(isStory: boolean) {
    const request = ++generation.current;
    setStory(isStory);
    setCard(null);
    try {
      const canvas = drawShareCard(data, isStory);
      const preview = canvas.toDataURL("image/png");
      canvas.toBlob((blob) => {
        if (request !== generation.current) return;
        if (blob) setCard({ preview, file: new File([blob], `${slug}-${isStory ? "story" : "feed"}.png`, { type: "image/png" }) });
        else setMessage("Gambar gagal dibuat.");
      }, "image/png");
    } catch {
      setMessage("Gambar gagal dibuat.");
    }
  }

  function recordShare() {
    void fetch(`/api/articles/${encodeURIComponent(slug)}/share`, {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
  }

  function openShare() {
    setUrl(new URL(`/artikel/${encodeURIComponent(slug)}`, window.location.origin).href);
    setNativeShare(typeof navigator.share === "function");
    setMessage("");
    setManualLink("");
    dialog.current?.showModal();
    prepareCard(story);
  }

  async function share(asImage = false) {
    setMessage("");
    setManualLink("");

    if (typeof navigator.share === "function") {
      try {
        const payload = asImage && card ? { files: [card.file] } : { title, url };
        if (asImage && (!card || !navigator.canShare?.(payload))) {
          setMessage("Unduh gambar untuk mengunggahnya dari aplikasi tujuan.");
          return;
        }
        await navigator.share(payload);
        recordShare();
        dialog.current?.close();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    if (asImage) setMessage("Unduh gambar untuk mengunggahnya dari aplikasi tujuan.");
    else await copyLink();
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

  const link = encodeURIComponent(url);
  const caption = encodeURIComponent(`${title}\n${url}`);
  const platforms = [
    ["WhatsApp", `https://wa.me/?text=${caption}`, "bxl-whatsapp"],
    ["Telegram", `https://t.me/share/url?url=${link}&text=${encodeURIComponent(title)}`, "bxl-telegram"],
    ["Threads", `https://www.threads.net/intent/post?text=${caption}`, "bx-at"],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${link}`, "bxl-facebook"],
    ["X", `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${link}`, "bx-link-external"],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${link}`, "bxl-linkedin"],
  ];

  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={openShare} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-rule px-3 text-sm font-medium text-ink hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2">
        <i className="bx bx-share-alt text-lg" aria-hidden="true" />
        Bagikan
      </button>
      <dialog ref={dialog} aria-labelledby={titleId} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">Bagikan artikel</h2>
          <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="grid size-10 place-items-center rounded-full hover:bg-gray-100">
            <i className="bx bx-x text-2xl" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3 grid gap-2 text-sm font-medium">
          <button type="button" onClick={() => void copyLink()} className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-100 px-3 hover:bg-gray-200">
            <i className="bx bx-link text-xl" aria-hidden="true" /> Salin tautan
          </button>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {platforms.map(([label, href, icon]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={recordShare}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-gray-100">
                <i className={`bx ${icon} text-xl`} aria-hidden="true" /> {label}
              </a>
            ))}
          </div>
          {nativeShare && <button type="button" onClick={() => void share()} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-gray-100">
            <i className="bx bx-share-alt text-xl" aria-hidden="true" /> Opsi berbagi lainnya
          </button>}
        </div>
        <section className="mt-4 border-t border-rule pt-4">
          <h3 className="font-semibold">Kartu artikel</h3>
          <p className="mt-1 text-sm text-mute">Untuk Instagram Story, Feed, DM, atau aplikasi lain.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={!story} onClick={() => prepareCard(false)} className="rounded border border-rule px-3 py-2 text-sm aria-pressed:bg-gray-100">Feed · 4:5</button>
            <button type="button" aria-pressed={story} onClick={() => prepareCard(true)} className="rounded border border-rule px-3 py-2 text-sm aria-pressed:bg-gray-100">Story · 9:16</button>
          </div>
          {card && (
            <div className="mt-3 flex items-start gap-3">
              <img src={card.preview} alt="Pratinjau kartu artikel" className="w-24 rounded-lg" />
              <div className="grid gap-2 text-sm">
                {nativeShare && <button type="button" onClick={() => void share(true)} className="rounded-lg bg-ink px-3 py-2 text-paper">Bagikan gambar</button>}
                <a href={card.preview} download={card.file.name} className="rounded-lg border border-rule px-3 py-2">Unduh PNG</a>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2">
                  <i className="bx bxl-instagram" aria-hidden="true" /> Buka Instagram
                </a>
              </div>
            </div>
          )}
        </section>
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

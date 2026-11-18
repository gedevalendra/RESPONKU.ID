"use client";

import { useId, useRef, useState } from "react";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

export default function ShareArticleButton({ slug, title }: { slug: string; title: string }) {
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [url, setUrl] = useState("");
  const [nativeShare, setNativeShare] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
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
    setNativeShare(typeof navigator.share === "function");
    setMessage("");
    setManualLink("");
    dialog.current?.showModal();
  }

  async function share() {
    setMessage("");
    setManualLink("");

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        recordShare();
        dialog.current?.close();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
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
    ["Instagram", "https://www.instagram.com/direct/inbox/", "bxl-instagram"],
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
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={label === "Instagram" ? () => void copyLink() : recordShare}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-gray-100">
                <i className={`bx ${icon} text-xl`} aria-hidden="true" /> {label}
              </a>
            ))}
          </div>
          {nativeShare && <button type="button" onClick={() => void share()} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-gray-100">
            <i className="bx bx-share-alt text-xl" aria-hidden="true" /> Opsi berbagi lainnya
          </button>}
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

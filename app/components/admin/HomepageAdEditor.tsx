"use client";

import { useState, type FormEvent } from "react";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";
import HomepageAdBanner from "@/app/components/landing/HomepageAdBanner";
import type { HomepageAd, HomepageAdSlot } from "@/lib/homepage-ad";

const inputClass = "w-full min-w-0 border border-rule bg-gray-50 px-3 py-2.5";

export default function HomepageAdEditor({ initial, slot }: { initial: HomepageAd; slot: HomepageAdSlot }) {
  const title = slot === "gallery" ? "Iklan Jelajahi Artikel" : "Iklan Berita Hangat";
  const [ad, setAd] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const mediaUrl = ad.mediaType === "video" ? ad.videoUrl : ad.imageUrl;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (!(await confirmAction("Simpan pengaturan iklan beranda?", "Simpan"))) return;
      const response = await fetch(`/api/admin/iklan?slot=${slot}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ad),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Iklan gagal disimpan.");
      setAd(result.ad);
      setMessage("Pengaturan iklan disimpan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Iklan gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <form onSubmit={save} className="border border-rule bg-paper">
        <h2 className="border-b border-rule px-5 py-4 font-display text-xl">{title}</h2>
        <fieldset disabled={busy} className="grid min-w-0 gap-4 p-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 accent-accent" checked={ad.enabled} onChange={(event) => setAd({ ...ad, enabled: event.target.checked })} />
            {slot === "gallery" ? "Tampilkan iklan di bawah slider artikel" : "Tampilkan iklan di bawah kartu Top 1"}
          </label>
          <label className="grid gap-2">Judul iklan
            <input value={ad.title} maxLength={100} required={ad.enabled} className={inputClass} onChange={(event) => setAd({ ...ad, title: event.target.value })} />
          </label>
          <label className="grid gap-2">Jenis media
            <select value={ad.mediaType} className={inputClass} onChange={(event) => setAd({ ...ad, mediaType: event.target.value as HomepageAd["mediaType"] })}>
              <option value="image">Gambar</option>
              <option value="video">Video</option>
            </select>
          </label>
          {ad.mediaType === "video" ? (
            <label className="grid gap-2">URL video
              <input type="url" value={ad.videoUrl} placeholder="YouTube atau https://…/video.mp4" required={ad.enabled} className={inputClass} onChange={(event) => setAd({ ...ad, videoUrl: event.target.value })} />
              <span className="text-xs text-mute">Bisa memakai link YouTube atau URL video langsung seperti MP4.</span>
            </label>
          ) : (
            <label className="grid gap-2">URL gambar banner
              <input type="url" value={ad.imageUrl} placeholder="https://…" required={ad.enabled} className={inputClass} onChange={(event) => setAd({ ...ad, imageUrl: event.target.value })} />
            </label>
          )}
          <label className="grid gap-2">Tautan tujuan
            <input type="url" value={ad.destination} placeholder="https://…" required={ad.enabled} className={inputClass} onChange={(event) => setAd({ ...ad, destination: event.target.value })} />
          </label>
          <button type="submit" className="justify-self-start bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50">{busy ? "Menyimpan…" : "Simpan"}</button>
        </fieldset>
      </form>
      {mediaUrl.startsWith("https://") && ad.destination.startsWith("https://") && (
        <aside className="min-w-0">
          <h2 className="mb-3 font-display text-xl">Pratinjau</h2>
          <HomepageAdBanner ad={ad} compact={slot === "gallery"} />
        </aside>
      )}
      <PopupStatus message={message} />
    </div>
  );
}

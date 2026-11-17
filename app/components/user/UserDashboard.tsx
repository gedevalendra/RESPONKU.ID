"use client";

import { useEffect, useState } from "react";
import type { Article, Profile } from "@/lib/types";

export default function UserDashboard({ actor }: { actor: Profile }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/user/articles").then(async (response) => { const data = await response.json(); if (response.ok) setArticles(data.articles); else setMessage(data.error); }); }, []);
  const pending = articles.filter((article) => article.status === "pending");
  const published = articles.filter((article) => article.status === "published");
  return <div className="grid gap-8 lg:grid-cols-3">
    <section className="bg-white p-6 shadow-sm"><p className="eyebrow">Profile Kamu</p><h2 className="mt-2 font-display text-2xl">{actor.displayName}</h2><p className="mt-2 break-all font-mono text-xs text-mute">{actor.email}</p><p className="mt-5 border-t border-rule pt-4 font-mono text-xs uppercase tracking-widest2 text-mute">Role: {actor.role}</p></section>
    <section id="notifikasi" className="bg-white p-6 shadow-sm"><p className="eyebrow">Notifikasi</p><h2 className="mt-2 font-display text-2xl">Status kiriman</h2><div className="mt-5 flex flex-col gap-3 font-mono text-xs"><p>{pending.length} artikel menunggu review admin</p><p>{published.length} artikel sudah terbit</p><p>{articles.filter((article) => article.status === "rejected").length} artikel ditolak</p></div></section>
    <section className="bg-white p-6 shadow-sm"><p className="eyebrow">Aksi cepat</p><h2 className="mt-2 font-display text-2xl">Mulai menulis</h2><a href="/akun/artikel" className="mt-5 inline-block bg-blue-500 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600">Buat artikel</a></section>
    <section id="riwayat" className="border-t border-ink pt-6 lg:col-span-3"><div className="flex items-baseline justify-between border-b border-rule pb-3"><h2 className="font-display text-display-md">Riwayat Publish</h2><span className="eyebrow">{articles.length} artikel</span></div>{message && <p className="mt-4 font-mono text-xs text-signal">{message}</p>}<div className="divide-y divide-rule">{articles.length === 0 && !message ? <p className="py-6 text-sm text-mute">Belum ada artikel yang dibuat.</p> : articles.map((article) => <article key={article.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="eyebrow">{article.status}</p><h3 className="mt-1 font-display text-xl">{article.title}</h3><p className="mt-1 text-sm text-mute">{article.rejectionReason || (article.status === "published" ? "Artikel telah diterbitkan." : "Menunggu pemeriksaan redaksi.")}</p></div><a href={`/akun/artikel?edit=${article.id}`} className="font-mono text-xs uppercase tracking-widest2 underline underline-offset-4">Kelola</a></article>)}</div></section>
  </div>;
}

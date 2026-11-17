"use client";

import { useEffect, useMemo, useState } from "react";
import type { Article, Category } from "@/lib/types";

const categories: Category[] = ["Ekonomi", "Teknologi", "Politik", "Olahraga", "Budaya"];
type Filter = "all" | NonNullable<Article["status"]>;
type FormState = { title: string; dek: string; category: Category; author: string; readTime: number; content: string; status: NonNullable<Article["status"]>; featured: boolean; breaking: boolean };
const empty: FormState = { title: "", dek: "", category: "Ekonomi", author: "", readTime: 5, content: "", status: "published", featured: false, breaking: false };

export default function ArticleManager({ superadminView = false }: { superadminView?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/articles", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setArticles(data.articles || []); else setMessage(data.error || "Artikel gagal dimuat.");
  }
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => filter === "all" ? articles : articles.filter((article) => article.status === filter), [articles, filter]);
  const count = (status: NonNullable<Article["status"]>) => articles.filter((article) => article.status === status).length;
  function change<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function edit(article: Article) {
    setEditing(article.id);
    setForm({ title: article.title, dek: article.dek, category: article.category, author: article.author, readTime: article.readTime, content: article.content.join("\n\n"), status: article.status || "draft", featured: Boolean(article.featured), breaking: Boolean(article.breaking) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditing(null); setForm(empty); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const payload = { ...form, content: form.content.split("\n\n").map((paragraph) => paragraph.trim()).filter(Boolean), readTime: Number(form.readTime) };
    const response = await fetch(editing ? `/api/admin/articles/${editing}` : "/api/admin/articles", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error || "Artikel gagal disimpan."); return; }
    reset(); setMessage(editing ? "Perubahan artikel tersimpan." : "Artikel berhasil dibuat."); await load();
  }
  async function updateStatus(article: Article, status: NonNullable<Article["status"]>, rejectionReason?: string) {
    setMessage("");
    const response = await fetch(`/api/admin/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, rejectionReason }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Status artikel gagal diubah."); return; }
    setMessage(status === "published" ? "Artikel disetujui dan diterbitkan." : "Artikel ditolak dan dikembalikan ke penulis."); await load();
  }
  async function reject(article: Article) {
    const reason = window.prompt("Alasan penolakan artikel:", article.rejectionReason || "Mohon perbaiki naskah sesuai catatan redaksi.");
    if (reason !== null) await updateStatus(article, "rejected", reason.trim() || "Perlu perbaikan editorial.");
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus artikel ini secara permanen?")) return;
    const response = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (response.ok) { setMessage("Artikel dihapus."); await load(); } else setMessage("Artikel gagal dihapus.");
  }

  return <div className="space-y-10">
    <div className="grid gap-3 sm:grid-cols-4">{(["all", "pending", "published", "rejected"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`p-4 text-left shadow-sm transition-colors ${filter === item ? "bg-blue-500 text-white" : "bg-white text-gray-800 hover:bg-blue-50"}`}><span className="eyebrow">{item === "all" ? "Semua" : item}</span><strong className="mt-2 block font-display text-3xl">{item === "all" ? articles.length : count(item)}</strong></button>)}</div>
    <div className={`grid gap-10 ${superadminView ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"}`}>
      {!superadminView && <form onSubmit={submit} className="flex flex-col gap-3 bg-white p-5 shadow-sm"><p className="eyebrow">{editing ? "Edit artikel" : "Artikel baru"}</p><input required minLength={5} value={form.title} onChange={(event) => change("title", event.target.value)} placeholder="Judul" className="px-3 py-2.5 text-sm" /><textarea required minLength={10} value={form.dek} onChange={(event) => change("dek", event.target.value)} placeholder="Dek / ringkasan" className="min-h-20 px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><select value={form.category} onChange={(event) => change("category", event.target.value as Category)} className="px-3 py-2.5 text-sm">{categories.map((category) => <option key={category}>{category}</option>)}</select><input required value={form.author} onChange={(event) => change("author", event.target.value)} placeholder="Penulis" className="px-3 py-2.5 text-sm" /></div><input type="number" min={1} max={60} value={form.readTime} onChange={(event) => change("readTime", Number(event.target.value))} className="px-3 py-2.5 text-sm" /><textarea required minLength={20} value={form.content} onChange={(event) => change("content", event.target.value)} placeholder="Isi artikel. Pisahkan paragraf dengan baris kosong." className="min-h-48 px-3 py-2.5 text-sm" /><div className="flex flex-wrap gap-4 font-mono text-xs"><label><input type="checkbox" checked={form.featured} onChange={(event) => change("featured", event.target.checked)} /> Unggulan</label><label><input type="checkbox" checked={form.breaking} onChange={(event) => change("breaking", event.target.checked)} /> Breaking news</label></div><select value={form.status} onChange={(event) => change("status", event.target.value as FormState["status"])} className="px-3 py-2.5 text-sm"><option value="published">Published</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="draft">Draft</option></select><button disabled={busy} className="bg-blue-500 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50">{busy ? "Menyimpan..." : editing ? "Simpan perubahan" : "Terbitkan artikel"}</button>{editing && <button type="button" onClick={reset} className="px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-gray-800 hover:text-blue-500">Batal edit</button>}{message && <p className="font-mono text-xs text-mute">{message}</p>}</form>}
      <section><div className="flex items-baseline justify-between border-b border-ink pb-3"><div><h2 className="font-display text-display-md">{superadminView ? "Approval editorial" : "Antrian editorial"}</h2><p className="mt-1 text-sm text-mute">{superadminView ? "Tinjau dan putuskan status artikel yang masuk." : "Kelola artikel dan proses review pengguna."}</p></div><span className="eyebrow">{visible.length} item</span></div><div className="divide-y divide-rule">{visible.length === 0 ? <p className="py-8 text-sm text-mute">Tidak ada artikel pada filter ini.</p> : visible.map((article) => <article key={article.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{article.status} · {article.category}</p><h3 className="mt-1 font-display text-xl">{article.title}</h3><p className="mt-1 text-sm text-mute">{article.author} · {article.views} views</p>{article.rejectionReason && <p className="mt-2 text-sm text-signal">Catatan: {article.rejectionReason}</p>}</div><div className="flex flex-wrap gap-2 font-mono text-[11px]">{!superadminView && <><button type="button" onClick={() => edit(article)} className="px-3 py-2 text-gray-800 hover:text-blue-500">Edit</button><button type="button" onClick={() => void remove(article.id)} className="px-3 py-2 text-gray-800 hover:text-blue-500">Hapus</button></>}{article.status !== "published" && <button type="button" onClick={() => void updateStatus(article, "published")} className="bg-blue-500 px-3 py-2 text-white hover:bg-blue-600">Approve</button>}{article.status !== "rejected" && <button type="button" onClick={() => void reject(article)} className="px-3 py-2 text-blue-500 hover:text-blue-700">Reject</button>}</div></div></article>)}</div></section>
    </div>
  </div>;
}

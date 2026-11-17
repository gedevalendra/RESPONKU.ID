"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Comment, ReactionSummary } from "@/lib/types";

const initialReactions: ReactionSummary = { like: 0, insightful: 0, celebrate: 0 };

export default function ArticleEngagement({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState(initialReactions);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const visitorId = useMemo(() => {
    if (typeof window === "undefined") return "server-render";
    const key = "responku-visitor-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  }, []);

  useEffect(() => {
    void fetch(`/api/articles/${encodeURIComponent(articleSlug)}/view`, { method: "POST" });
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`).then((r) => r.ok ? r.json() : null).then((data) => data && setComments(data.comments || []));
    fetch(`/api/reactions?articleSlug=${encodeURIComponent(articleSlug)}`).then((r) => r.json()).then(setReactions).catch(() => undefined);
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const channel = supabase.channel(`comments:${articleSlug}`).on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `article_slug=eq.${articleSlug}` }, () => {
      fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`).then((r) => r.json()).then((data) => setComments(data.comments || []));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [articleSlug]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleSlug, displayName: name, body }) });
    const data = await response.json();
    if (response.ok) { setName(""); setBody(""); setMessage(data.comment.status === "pending" ? "Komentar menunggu moderasi." : "Komentar diterbitkan."); if (data.comment.status === "published") setComments((current) => [data.comment, ...current]); }
    else setMessage(data.error || "Komentar gagal disimpan.");
    setBusy(false);
  }

  async function react(reaction: keyof ReactionSummary) {
    const response = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleSlug, reaction, visitorId }) });
    if (response.ok) setReactions(await response.json());
  }

  return <section className="mt-16 border-t border-rule pt-8" aria-label="Interaksi pembaca">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
      <div><p className="eyebrow">Suara pembaca</p><h2 className="mt-1 font-display text-display-md">Apa pendapat Anda?</h2></div>
      <div className="flex gap-2 font-mono text-xs">
        <button onClick={() => react("like")} className="border border-rule px-3 py-2 hover:border-ink">Suka · {reactions.like}</button>
        <button onClick={() => react("insightful")} className="border border-rule px-3 py-2 hover:border-ink">Mencerahkan · {reactions.insightful}</button>
        <button onClick={() => react("celebrate")} className="border border-rule px-3 py-2 hover:border-ink">Apresiasi · {reactions.celebrate}</button>
      </div>
    </div>
    <form onSubmit={submitComment} className="mt-6 grid gap-3 sm:grid-cols-2">
      <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} placeholder="Nama tampilan" className="border border-ink bg-paper px-3 py-2.5 text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={3} maxLength={2000} placeholder="Tulis komentar Anda…" className="min-h-24 border border-ink bg-paper px-3 py-2.5 text-sm sm:col-span-2" />
      <button disabled={busy} className="w-fit bg-ink px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 text-paper disabled:opacity-50">{busy ? "Menyimpan…" : "Kirim komentar"}</button>
      {message && <p className="self-center font-mono text-xs text-mute">{message}</p>}
    </form>
    <div className="mt-8 divide-y divide-rule">{comments.length === 0 ? <p className="py-5 text-sm text-mute">Belum ada komentar. Jadilah yang pertama berdiskusi.</p> : comments.map((comment) => <article key={comment.id} className="py-5"><div className="flex items-baseline justify-between gap-4"><h3 className="font-display text-lg">{comment.displayName}</h3><time className="font-mono text-[11px] text-mute">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(comment.createdAt))}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-mute">{comment.body}</p></article>)}</div>
  </section>;
}

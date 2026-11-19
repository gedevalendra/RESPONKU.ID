"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Comment, ReactionSummary } from "@/lib/types";

const initialReactions: ReactionSummary = {
  like: 0,
  insightful: 0,
  celebrate: 0,
};

function LikeEffect({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex" data-like-effect>
      {children}
      <span className="pointer-events-none absolute inset-0" aria-hidden="true">
        {["#1d4ed8", "#3b82f6", "#38bdf8", "#60a5fa", "#2563eb", "#38bdf8", "#3b82f6", "#60a5fa"].map((color, index) => (
          <span key={index} className="absolute left-1/2 top-1/2 size-2 rounded-full opacity-0" style={{ backgroundColor: color }} />
        ))}
      </span>
    </span>
  );
}

function burstLike(event: MouseEvent<HTMLButtonElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  event.currentTarget.querySelectorAll("[data-like-effect] > span > span").forEach((particle, index) => {
    const angle = index * Math.PI / 4;
    particle.getAnimations().forEach((animation) => animation.cancel());
    particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.5)", opacity: 1 },
        { transform: `translate(${Math.cos(angle) * 34}px, ${Math.sin(angle) * 34}px) scale(0.25)`, opacity: 0 },
      ],
      { duration: 580, easing: "ease-out" },
    );
  });
}

function animateVote(event: MouseEvent<HTMLButtonElement>, down = false) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const arrow = event.currentTarget.querySelector("svg");
  if (!arrow) return;
  arrow.getAnimations().forEach((animation) => animation.cancel());
  const distance = down ? 9 : -9;
  arrow.animate(
    [
      { translate: "0 0" },
      { translate: `0 ${-distance / 3}px`, offset: 0.18 },
      { translate: `0 ${distance}px`, offset: 0.48 },
      { translate: "0 0" },
    ],
    { duration: 360, easing: "ease-in-out" },
  );
}

function VoteArrow({ down = false, active }: { down?: boolean; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={down ? "size-5 rotate-180" : "size-5"}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 3 12h5v8h8v-8h5z" />
    </svg>
  );
}

export default function ArticleEngagement({
  articleSlug,
}: {
  articleSlug: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const pendingVotes = useRef(new Set<string>());
  const [visibleCount, setVisibleCount] = useState(4);
  const [visibleReplyCounts, setVisibleReplyCounts] = useState<Record<string, number>>({});
  const [reactions, setReactions] = useState(initialReactions);
  const [articleReaction, setArticleReaction] = useState<keyof ReactionSummary | null>(null);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [reactionsReady, setReactionsReady] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [reactionError, setReactionError] = useState("");
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
  const commentThreads = useMemo(() => {
    return comments
      .filter((comment) => !comment.parentId)
      .map((comment) => {
        const replies = comments
          .filter((reply) => reply.parentId === comment.id)
          .sort(
            (first, second) =>
              new Date(first.createdAt).getTime()
              - new Date(second.createdAt).getTime(),
          );
        const interactionCount = comment.likes
          + comment.dislikes
          + replies.length
          + replies.reduce(
            (total, reply) => total + reply.likes + reply.dislikes,
            0,
          );
        return { comment, replies, interactionCount };
      })
      .sort(
        (first, second) =>
          second.interactionCount - first.interactionCount
          || new Date(second.comment.createdAt).getTime()
            - new Date(first.comment.createdAt).getTime(),
      );
  }, [comments]);

  useEffect(() => {
    void fetch("/api/auth/me").then((response) => response.json()).then((data) => setAccountName(data.user?.displayName || "")).catch(() => undefined);
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setComments(data.comments || []));
    fetch(`/api/reactions?articleSlug=${encodeURIComponent(articleSlug)}&visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(({ viewerReaction, ...summary }) => {
        setReactions(summary);
        setArticleReaction(viewerReaction ?? null);
      })
      .catch(() => undefined)
      .finally(() => setReactionsReady(true));
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const channel = supabase
      .channel(`comments:${articleSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `article_slug=eq.${articleSlug}`,
        },
        () => {
          fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => setComments(data.comments || []));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [articleSlug, visitorId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleSlug, body, parentId: replyTo || undefined }),
    });
    const data = await response.json();
    if (response.ok) {
      setBody("");
      setReplyTo(null);
      setMessage(
        data.comment.status === "pending"
          ? "Komentar memerlukan pemeriksaan admin sebelum ditampilkan."
          : "Komentar diterbitkan.",
      );
      if (data.comment.status === "published")
        setComments((current) => [data.comment, ...current]);
    } else setMessage(data.error || "Komentar gagal disimpan.");
    setBusy(false);
  }

  async function react(reaction: keyof ReactionSummary) {
    if (!reactionsReady || reactionBusy || reaction === articleReaction) return;
    const previous = { ...reactions };
    const optimistic = { ...previous };
    if (articleReaction) optimistic[articleReaction] = Math.max(0, optimistic[articleReaction] - 1);
    optimistic[reaction]++;
    setReactionError("");
    setReactionBusy(true);
    setArticleReaction(reaction);
    setReactions(optimistic);
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleSlug, reaction, visitorId }),
      });
      if (!response.ok) throw new Error("Reaksi gagal disimpan");
      setReactions(await response.json());
    } catch {
      setArticleReaction(articleReaction);
      setReactions(previous);
      setReactionError("Reaksi artikel gagal disimpan. Coba lagi.");
    } finally {
      setReactionBusy(false);
    }
  }

  async function reactComment(commentId: string, reaction: "like" | "dislike") {
    if (pendingVotes.current.has(commentId)) return;
    const previous = comments.find((comment) => comment.id === commentId);
    if (!previous) return;
    pendingVotes.current.add(commentId);
    const next = previous.viewerReaction === reaction ? null : reaction;
    setComments((current) => current.map((comment) => comment.id === commentId ? {
      ...comment,
      viewerReaction: next,
      likes: Math.max(0, comment.likes - Number(previous.viewerReaction === "like") + Number(next === "like")),
      dislikes: Math.max(0, comment.dislikes - Number(previous.viewerReaction === "dislike") + Number(next === "dislike")),
    } : comment));
    setReactionError("");
    try {
    const response = await fetch("/api/comment-reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, reaction, visitorId }) });
    if (!response.ok) throw new Error("Reaksi gagal diproses");
    const result = await response.json();
    setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, likes: result.likes, dislikes: result.dislikes, viewerReaction: result.reaction } : comment));
    } catch {
      setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, likes: previous.likes, dislikes: previous.dislikes, viewerReaction: previous.viewerReaction } : comment));
      setReactionError("Reaksi belum dapat diproses. Coba lagi.");
    } finally {
      pendingVotes.current.delete(commentId);
    }
  }

  function descendantReplies(parentId: string): Comment[] {
    const result: Comment[] = [];
    const append = (id: string) => {
      comments
        .filter((item) => item.parentId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .forEach((reply) => {
          result.push(reply);
          append(reply.id);
        });
    };
    append(parentId);
    return result;
  }

  function renderComment(comment: Comment, depth = 0, visibleReplies?: Set<string>): ReactNode {
    const replies = comments
      .filter((item) => item.parentId === comment.id && (!visibleReplies || visibleReplies.has(item.id)))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const roles = { reader: "Pembaca", author: "Penulis", admin: "Admin", superadmin: "Superadmin" };
    return <article key={comment.id} className="comment-node relative pt-5">
      <div className="flex gap-3">
        <div className="relative z-10 grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100 ring-4 ring-white">
          {comment.avatarUrl ? <img src={comment.avatarUrl} alt="" className="size-full object-cover" /> : <i className="bx bxs-user text-xl text-mute" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{comment.displayName}</h3><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{roles[comment.role || "reader"]}</span><time className="text-xs text-mute">{commentTime(comment.createdAt)}</time></div>
          {depth > 0 && <p className="mt-1 text-xs text-mute">Membalas {comments.find((item) => item.id === comment.parentId)?.displayName}</p>}
          <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
          <div className="mt-2 flex gap-2 text-xs">
            {(["like", "dislike"] as const).map((vote) => <button key={vote} type="button" aria-label={vote === "like" ? "Sukai komentar" : "Tidak menyukai komentar"} aria-pressed={comment.viewerReaction === vote} onClick={(event) => { if (comment.viewerReaction !== vote) { animateVote(event, vote === "dislike"); if (vote === "like") burstLike(event); } void reactComment(comment.id, vote); }} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 transition-colors ${comment.viewerReaction === vote ? "text-gray-800" : "text-mute hover:text-ink"}`}>{vote === "like" ? <LikeEffect><VoteArrow active={comment.viewerReaction === vote} /></LikeEffect> : <VoteArrow down active={comment.viewerReaction === vote} />}{vote === "like" ? comment.likes : comment.dislikes}</button>)}
            <button type="button" onClick={() => { setReplyTo(comment.id); setBody(""); }} className="rounded-full px-3 text-mute hover:bg-gray-100">Balas</button>
          </div>
        </div>
      </div>
      {replies.length > 0 && <div className={`comment-children ${depth === 0 ? "comment-indent" : depth === 1 ? "comment-indent-desktop" : ""}`}>
        {replies.map((reply) => renderComment(reply, depth + 1, visibleReplies))}
      </div>}
    </article>;
  }

  function commentTime(value: string) {
    const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
  }

  return (
    <section
      className="mt-16 border-t border-rule pt-8"
      aria-label="Interaksi pembaca"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <p className="eyebrow">Suara pembaca</p>
          <h2 className="mt-1 font-display text-display-md">
            Apa pendapat Anda?
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            onClick={(event) => { if (articleReaction !== "like") burstLike(event); void react("like"); }}
            aria-pressed={articleReaction === "like"}
            disabled={!reactionsReady || reactionBusy}
            className="inline-flex min-h-10 items-center gap-2 border border-rule px-3 py-2 hover:border-ink"
          >
            <LikeEffect><i className={`bx ${articleReaction === "like" ? "bxs-like text-gray-800" : "bx-like"} text-xl`} aria-hidden="true" /></LikeEffect>
            Suka · {reactions.like}
          </button>
          <button
            onClick={() => react("insightful")}
            aria-pressed={articleReaction === "insightful"}
            disabled={!reactionsReady || reactionBusy}
            className="inline-flex min-h-10 items-center gap-2 border border-rule px-3 py-2 hover:border-ink"
          >
            <i className={`bx ${articleReaction === "insightful" ? "bxs-bulb text-gray-800" : "bx-bulb"} text-xl`} aria-hidden="true" />
            Mencerahkan · {reactions.insightful}
          </button>
          <button
            onClick={() => react("celebrate")}
            aria-pressed={articleReaction === "celebrate"}
            disabled={!reactionsReady || reactionBusy}
            className="inline-flex min-h-10 items-center gap-2 border border-rule px-3 py-2 hover:border-ink"
          >
            <i className={`bx ${articleReaction === "celebrate" ? "bxs-party text-gray-800" : "bx-party"} text-xl`} aria-hidden="true" />
            Apresiasi · {reactions.celebrate}
          </button>
        </div>
      </div>
      <form onSubmit={submitComment} className={replyTo ? "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 grid gap-2 border-t border-rule bg-paper p-3 shadow-lg sm:grid-cols-[1fr_auto] lg:static lg:mt-6 lg:grid-cols-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none" : "mt-6 grid gap-3 sm:grid-cols-2"}>
        <p className="text-sm text-mute sm:col-span-2">{accountName ? `Berkomentar sebagai ${accountName}` : <a href="/masuk" className="text-blue-500">Masuk untuk berkomentar</a>}</p>
        {replyTo && <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs text-mute sm:col-span-2"><span>Membalas komentar</span><button type="button" onClick={() => setReplyTo(null)} className="underline hover:text-ink">Batal</button></div>}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={3}
          maxLength={2000}
          placeholder="Tulis komentar Anda…"
          className={`${replyTo ? "min-h-14" : "min-h-24"} border border-ink bg-paper px-3 py-2.5 text-sm sm:col-span-2`}
        />
        <button
          disabled={busy || !accountName}
          className="w-fit bg-ink px-4 py-2.5 font-mono text-xs uppercase tracking-widest2 text-paper disabled:opacity-50"
        >
          {busy ? "Menyimpan…" : "Kirim komentar"}
        </button>
        {message && (
          <PopupStatus message={message} />
        )}
      </form>
      <div className="mt-8 divide-y divide-rule">
        <PopupStatus message={reactionError} />
        {comments.length === 0 ? (
          <p className="py-5 text-sm text-mute">
            Belum ada komentar. Jadilah yang pertama berdiskusi.
          </p>
        ) : (
          <>
            {commentThreads.slice(0, visibleCount).map(({ comment }) => {
              const allReplies = descendantReplies(comment.id);
              const visibleReplyCount = visibleReplyCounts[comment.id] ?? 2;
              const visibleReplies = new Set(allReplies.slice(0, visibleReplyCount).map((reply) => reply.id));
              const remainingReplies = Math.max(0, allReplies.length - visibleReplyCount);
              return <div key={comment.id}>
                {renderComment(comment, 0, visibleReplies)}
                {remainingReplies > 0 && <button type="button" onClick={() => setVisibleReplyCounts((counts) => ({ ...counts, [comment.id]: Math.min(allReplies.length, visibleReplyCount + 2) }))} className="mb-5 ml-12 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-800 hover:bg-gray-100"><i className="bx bx-message-rounded-dots text-lg" aria-hidden="true" />Lihat {Math.min(2, remainingReplies)} balasan lagi ({remainingReplies} tersisa)</button>}
              </div>;
            })}
            {commentThreads.length > visibleCount && <button type="button" onClick={() => setVisibleCount((count) => count + 4)} className="my-4 rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium">Lihat komentar lain ({commentThreads.length - visibleCount})</button>}
          </>
        )}
      </div>
    </section>
  );
}

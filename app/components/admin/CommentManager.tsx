"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";
import { useEffect, useState } from "react";

type Comment = { id: string; display_name: string; body: string; article_slug: string; status: string };
export default function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/admin/comments");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setComments(data.comments || []);
  }
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);
  async function moderate(id: string, status: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load(); setMessage("Status komentar diperbarui.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Perubahan gagal"); }
    finally { setBusy(false); }
  }
  const visible = comments.filter((comment) => !filter || comment.status === filter);
  return <section className="space-y-5 bg-white p-5"><label className="flex items-center gap-3 text-sm">Status komentar<select value={filter} onChange={(event) => setFilter(event.target.value)} className="p-3"><option value="pending">Menunggu moderasi</option><option value="published">Diterbitkan</option><option value="rejected">Ditolak</option><option value="">Semua</option></select></label><PopupStatus message={message} /><div className="divide-y divide-rule">{visible.map((comment) => <article key={comment.id} className="space-y-3 py-4"><p className="font-medium">{comment.display_name}</p><a href={`/artikel/${comment.article_slug}`} className="block text-xs text-blue-500">Lihat artikel →</a><p className="whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p><div className="flex flex-wrap gap-4 text-sm"><button disabled={busy || comment.status === "published"} onClick={() => void moderate(comment.id, "published")} className="text-blue-500 disabled:opacity-40">Setujui</button><button disabled={busy || comment.status === "rejected"} onClick={() => void moderate(comment.id, "rejected")} className="text-red-600 disabled:opacity-40">Tolak</button><button disabled={busy || comment.status === "pending"} onClick={() => void moderate(comment.id, "pending")} className="disabled:opacity-40">Tinjau ulang</button></div></article>)}{!visible.length && <p className="py-6 text-sm text-mute">Tidak ada komentar pada status ini.</p>}</div></section>;
}

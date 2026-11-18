"use client";
import { PopupStatus } from "@/app/components/layout/ActionFeedback";
import { useEffect, useState } from "react";

type Question = { id: string; displayName: string; question: string; status: string; answer?: string };
export default function FaqQuestions({ admin = false }: { admin?: boolean }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  async function load() {
    const response = await fetch("/api/faq", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setQuestions(data.questions || []);
  }
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, []);
  async function send(body: object, method: "POST" | "PATCH") {
    setBusy(true);
    try {
      const response = await fetch("/api/faq", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load(); setMessage(method === "POST" ? "Pertanyaan terkirim. Jawaban akan masuk ke Notifikasi." : "Perubahan disimpan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Gagal menyimpan"); }
    finally { setBusy(false); }
  }
  const labels: Record<string, string> = { pending: "Menunggu pemeriksaan", approved: "Disetujui · menunggu jawaban", answered: "Sudah dijawab", rejected: "Tidak disetujui" };
  return <section id="pertanyaan-saya" className="space-y-5">
    {!admin && <form className="grid gap-3 bg-gray-800/5 p-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void send({ question: form.get("question") }, "POST"); }}><h2 className="text-lg font-semibold">Belum menemukan jawaban?</h2><label htmlFor="faq-question" className="text-sm text-mute">Tulis pertanyaanmu untuk redaksi.</label><textarea id="faq-question" name="question" required minLength={10} maxLength={2000} rows={4} className="w-full p-3" /><button disabled={busy} className="justify-self-start bg-ink px-4 py-3 text-sm text-white disabled:opacity-50">{busy ? "Mengirim…" : "Kirim pertanyaan"}</button></form>}
    <PopupStatus message={message} />
    <h2 className="text-lg font-semibold">{admin ? "Pengajuan pertanyaan" : "Pertanyaan saya"}</h2>
    <div className="divide-y divide-rule">{questions.map((question) => <article key={question.id} className="space-y-3 py-5"><p className="text-xs text-mute">{admin && `${question.displayName} · `}{labels[question.status]}</p><h3 className="whitespace-pre-wrap break-words font-medium">{question.question}</h3>{question.status === "answered" && question.answer && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-mute">{question.answer}</p>}{admin && <div className="space-y-3">{question.status === "pending" && <button disabled={busy} className="mr-4 text-sm text-blue-500" onClick={() => void send({ id: question.id, status: "approved" }, "PATCH")}>Setujui</button>}{question.status !== "rejected" && question.status !== "answered" && <button disabled={busy} className="text-sm text-red-600" onClick={() => void send({ id: question.id, status: "rejected" }, "PATCH")}>Tolak</button>}{["approved", "answered"].includes(question.status) && <><textarea aria-label="Jawaban admin" maxLength={500} rows={3} value={drafts[question.id] ?? question.answer ?? ""} onChange={(event) => setDrafts({ ...drafts, [question.id]: event.target.value })} className="w-full p-3" placeholder="Tulis jawaban untuk pengguna…" /><button disabled={busy} className="bg-ink px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => void send({ id: question.id, status: "answered", answer: drafts[question.id] ?? question.answer ?? "" }, "PATCH")}>Balas & kirim notifikasi</button></>}</div>}</article>)}{!questions.length && <p className="py-4 text-sm text-mute">Belum ada pertanyaan.</p>}</div>
  </section>;
}

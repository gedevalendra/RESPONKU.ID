"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";
import { formatDate } from "@/lib/content";
import type { Article } from "@/lib/types";

type Row = Pick<Article, "id" | "slug" | "title" | "author" | "category" | "publishedAt" | "date" | "status" | "views">;
const actions = {
  takedown: "Takedown artikel",
  promote: "Promosikan",
  unpromote: "Hentikan promosi",
  delete: "Hapus permanen",
};
type Action = keyof typeof actions;

export default function PublicationHistoryTable({ rows, canDelete }: { rows: Row[]; canDelete: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<Action | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const eligible = rows.filter((row) => row.status === "published").map((row) => row.id);
  const targets = eligible.filter((id) => selected.includes(id));
  const allSelected = eligible.length > 0 && targets.length === eligible.length;

  async function apply(operation: Action, reason?: string) {
    setBusy(true);
    setMessage("");
    const failed: string[] = [];
    for (const id of targets) {
      const url = `/api/admin/articles/${encodeURIComponent(id)}`;
      try {
        const response = await fetch(operation === "delete" ? url : `${url}/publication`, operation === "delete" ? {
          method: "DELETE",
        } : {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(operation === "takedown"
            ? { action: "takedown", note: reason }
            : { action: "promote", promoted: operation === "promote" }),
        });
        if (!response.ok) failed.push(id);
      } catch {
        failed.push(id);
      }
    }
    setSelected(failed);
    setMessage(`${targets.length - failed.length} artikel berhasil diproses.${failed.length ? ` ${failed.length} gagal dan tetap dipilih.` : ""}`);
    setBusy(false);
    router.refresh();
  }

  async function confirm() {
    if (!action || !targets.length || busy) return;
    if (action === "takedown") {
      setNote("");
      dialog.current?.showModal();
    } else if (await confirmAction(`${actions[action]} untuk ${targets.length} artikel?`, actions[action])) {
      await apply(action);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allSelected} disabled={busy || !eligible.length}
            ref={(input) => { if (input) input.indeterminate = targets.length > 0 && !allSelected; }}
            onChange={() => setSelected(allSelected ? [] : eligible)} />
          Pilih semua artikel terbit
        </label>
        <span className="text-mute">{targets.length} dipilih</span>
        <select aria-label="Aksi untuk artikel terpilih" value={action} disabled={busy}
          onChange={(event) => setAction(event.target.value as Action | "")} className="border border-rule px-2 py-2">
          <option value="">Pilih aksi</option>
          {Object.entries(actions).filter(([key]) => key !== "delete" || canDelete)
            .map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="button" disabled={!action || !targets.length || busy} onClick={() => void confirm()}
          className="bg-ink px-3 py-2 text-paper disabled:opacity-50">{busy ? "Memproses…" : "Terapkan"}</button>
      </div>
      <PopupStatus message={message} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-y border-rule text-mute">
            <tr><th className="sr-only">Pilihan</th><th className="py-3 pr-4">Artikel</th><th className="pr-4">Tanggal</th><th className="pr-4">Status</th><th className="text-right">Tayangan</th></tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="pr-3"><input type="checkbox" aria-label={`Pilih ${row.title}`}
                  checked={targets.includes(row.id)} disabled={busy || row.status !== "published"}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelected((current) => checked ? [...current, row.id] : current.filter((id) => id !== row.id));
                  }} /></td>
                <td className="max-w-md py-3 pr-4">
                  {row.status === "published" ? <Link className="font-medium hover:underline" href={`/artikel/${encodeURIComponent(row.slug)}`}>{row.title}</Link> : <span className="font-medium">{row.title}</span>}
                  <p className="mt-1 text-xs text-mute">{row.author} · {row.category}</p>
                </td>
                <td className="whitespace-nowrap pr-4">{formatDate(row.publishedAt ?? row.date)}
                  {!row.publishedAt && <span className="block text-xs text-mute">Tanggal artikel</span>}
                </td>
                <td className="whitespace-nowrap pr-4">{row.status === "published" ? "Terbit" : "Ditarik"}</td>
                <td className="text-right tabular-nums">{(row.views ?? 0).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog ref={dialog} aria-labelledby="history-takedown-title"
        className="action-popup fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-5 text-ink shadow-xl backdrop:bg-black/40">
        <h3 id="history-takedown-title" className="text-lg font-semibold">Tarik {targets.length} artikel?</h3>
        <form className="mt-4 grid gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (busy || !note.trim() || !targets.length) return;
          dialog.current?.close();
          void apply("takedown", note.trim());
        }}>
          <label className="grid gap-2 text-sm">Catatan untuk penulis
            <textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={500} rows={4} className="border border-rule p-3" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="border border-rule px-4 py-2" onClick={() => dialog.current?.close()}>Batal</button>
            <button disabled={!note.trim()} className="bg-ink px-4 py-2 text-paper disabled:opacity-50">Tarik artikel</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

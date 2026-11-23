"use client";

import { useEffect, useState } from "react";
import { confirmAction, PopupStatus } from "@/app/components/layout/ActionFeedback";

type Status = "online" | "takedown" | "maintenance" | "busy";

const options: { value: Status; label: string; description: string }[] = [
  { value: "online", label: "Website aktif", description: "Website dapat diakses seperti biasa." },
  { value: "takedown", label: "Website sedang di-takedown", description: "Menampilkan halaman takedown kepada pengunjung." },
  { value: "maintenance", label: "Website sedang maintenance", description: "Menampilkan halaman pemeliharaan kepada pengunjung." },
  { value: "busy", label: "Website sedang sibuk", description: "Menampilkan halaman kendala kapasitas kepada pengunjung." },
];

export default function WebsiteStatusManager() {
  const [status, setStatus] = useState<Status>("online");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/website-status")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setStatus(data.status.status || "online");
        setMessage(data.status.message || "");
      })
      .catch((error) => setFeedback(error instanceof Error ? error.message : "Status gagal dimuat"))
      .finally(() => setInitialLoading(false));
  }, []);

  async function save(nextStatus: Status) {
    if (!(await confirmAction("Ubah status website dan tampilkan kepada pengunjung?", "Ubah status"))) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/website-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(nextStatus);
      setFeedback(nextStatus === "online" ? "Website kembali aktif." : "Status website diperbarui.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Status gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  if (initialLoading) return <section className="rounded-xl border border-rule bg-white p-6 text-sm text-mute">Memuat status website…</section>;

  return (
    <section className="rounded-xl border border-rule bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-2xl">Status website</h2>
        <p className="mt-1 text-sm text-mute">Atur tampilan yang diterima pengunjung saat situs tidak normal.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className={`cursor-pointer rounded-xl border p-4 ${status === option.value ? "border-blue-500 bg-blue-50" : "border-rule hover:bg-gray-50"}`}>
            <span className="flex items-start gap-3">
              <input type="radio" name="website-status" value={option.value} checked={status === option.value} disabled={busy} onChange={() => void save(option.value)} className="mt-1" />
              <span><span className="block font-semibold">{option.label}</span><span className="mt-1 block text-sm text-mute">{option.description}</span></span>
            </span>
          </label>
        ))}
      </div>
      <label className="mt-5 grid max-w-xl gap-2 text-sm font-medium">
        Pesan kepada pengunjung
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder="Contoh: Kami sedang memperbarui layanan." className="rounded-lg border border-rule p-3 font-normal" />
      </label>
      {message && status !== "online" && <button type="button" disabled={busy} onClick={() => void save(status)} className="mt-3 min-h-11 rounded-lg bg-ink px-4 text-sm text-white disabled:opacity-50">Simpan pesan</button>}
      <PopupStatus message={feedback} />
    </section>
  );
}

"use client";

import { useState } from "react";

export default function TickerManager({ initial }: { initial: string[] }) {
  const [value, setValue] = useState(initial.join("\n"));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const headlines = value.split("\n").map((item) => item.trim()).filter(Boolean);
    const response = await fetch("/api/admin/ticker", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headlines }),
    });
    const data = await response.json();
    setBusy(false);
    setMessage(response.ok ? "Ticker berhasil disimpan." : data.error || "Ticker gagal disimpan.");
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5 bg-paper p-6 sm:p-8">
      <div>
        <p className="eyebrow">Ticker terkini</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Informasi di bar hitam</h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Isi satu informasi per baris. Jika dikosongkan, ResponKu akan menampilkan berita terpopuler dan dapat merangkum judulnya dengan Groq.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={8}
        maxLength={3000}
        placeholder="Contoh: Pendaftaran artikel warga dibuka hari ini"
        className="w-full px-4 py-3"
      />
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={busy} className="bg-blue-500 px-5 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600 disabled:opacity-50">
          {busy ? "Menyimpan..." : "Simpan ticker"}
        </button>
        <span className="text-xs text-mute">Kosongkan semua baris untuk mode otomatis.</span>
        {message && <span className="font-mono text-xs text-mute">{message}</span>}
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <div className="border border-ink p-0">
      <p className="eyebrow py-2">Ringkasan Pagi</p>
      <h3 className="mt-2 font-display text-xl leading-snug">
        Lima berita penting, terkirim jam 6 pagi setiap hari kerja.
      </h3>
      {status === "sent" ? (
        <p className="mt-4 font-mono text-xs text-mute">
          Terdaftar. Ringkasan pertama tiba besok pagi.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
          <label htmlFor="newsletter-email" className="sr-only">
            Alamat email
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="nama@email.com"
            className="border border-ink bg-paper px-3 py-2.5 text-sm placeholder:text-mute focus-visible:outline-none"
          />
          <button
            type="submit"
            className="bg-ink px-3 py-2.5 font-mono text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-85"
          >
            Berlangganan
          </button>
          {status === "error" && (
            <p className="font-mono text-[11px] text-signal">
              Pendaftaran gagal. Pastikan Supabase sudah diisi.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

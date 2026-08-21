"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    // sambungkan ke endpoint autentikasi Anda di sini
    window.setTimeout(() => setStatus("idle"), 900);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-widest2 text-mute">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@email.com"
          className="border border-ink bg-paper px-3 py-2.5 text-sm placeholder:text-mute focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-widest2 text-mute">
            Kata Sandi
          </label>
          <Link href="/lupa-sandi" className="font-mono text-[11px] text-mute hover:text-ink">
            Lupa sandi?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="border border-ink bg-paper px-3 py-2.5 text-sm placeholder:text-mute focus-visible:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-1 bg-ink px-3 py-3 font-mono text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {status === "submitting" ? "Memproses…" : "Masuk"}
      </button>

      <p className="text-center font-mono text-[11px] text-mute">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-ink underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </form>
  );
}

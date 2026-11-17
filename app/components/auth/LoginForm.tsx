"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginForm() {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Supabase belum dikonfigurasi di .env.local.");
      setStatus("idle");
      return;
    }
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
    if (result.error) setError(result.error.message);
    else if (mode === "signup")
      setNotice("Akun dibuat. Cek email Anda untuk konfirmasi.");
    else window.location.href = "/";
    setStatus("idle");
  }

  async function signIn(provider: "google" | "custom:funikin") {
    if (provider === "google" || provider === "custom:funikin") {
      window.location.href =
        provider === "google" ? "/auth/google" : "/auth/funikin";
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Supabase belum dikonfigurasi di .env.local.");
      return;
    }
    setStatus("submitting");
    setError("");
    const selectedProvider =
      provider === "custom:funikin"
        ? ((process.env.NEXT_PUBLIC_SUPABASE_FUNIKIN_PROVIDER ||
            provider) as "custom:funikin")
        : "google";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: selectedProvider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => signIn("google")}
          className="bg-blue-500 px-2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-blue-600"
        >
          Google
        </button>
        <span aria-hidden="true" />
        <button
          type="button"
          onClick={() => signIn("custom:funikin")}
          className="bg-gray-800 px-2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-gray-700"
        >
          FunikIn
        </button>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-mute">
        <span className="h-px flex-1 bg-rule" />
        atau email
        <span className="h-px flex-1 bg-rule" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="font-mono text-[11px] uppercase tracking-widest2 text-mute"
        >
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
          <label
            htmlFor="password"
            className="font-mono text-[11px] uppercase tracking-widest2 text-mute"
          >
            Kata Sandi
          </label>
          <Link
            href="/lupa-sandi"
            className="font-mono text-[11px] text-mute hover:text-ink"
          >
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
        className="mt-1 bg-blue-500 px-3 py-3 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
      >
        {status === "submitting"
          ? "Memproses…"
          : mode === "login"
            ? "Masuk"
            : "Buat akun"}
      </button>

      {error && <p className="font-mono text-[11px] text-signal">{error}</p>}
      {notice && <p className="font-mono text-[11px] text-mute">{notice}</p>}
      <p className="text-center font-mono text-[11px] text-mute">
        {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-ink underline underline-offset-4"
        >
          {mode === "login" ? "Daftar" : "Masuk"}
        </button>
      </p>
    </form>
  );
}

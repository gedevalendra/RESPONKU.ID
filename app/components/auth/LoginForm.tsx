"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import BrandLogo from "@/app/components/layout/BrandLogo";

function FieldIcon({ type }: { type: "email" | "password" }) {
  return type === "email" ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 fill-none stroke-current stroke-[1.8]"><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="m3.5 5.5 6.5 5 6.5-5" /></svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 fill-none stroke-current stroke-[1.8]"><rect x="3.5" y="8.5" width="13" height="9" rx="2" /><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" /></svg>
  );
}

export default function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("submitting"); setError(""); setNotice("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")); const password = String(form.get("password"));
    const supabase = getSupabaseBrowser();
    if (!supabase) { setError("Supabase belum dikonfigurasi di .env.local."); setStatus("idle"); return; }
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (result.error) setError(result.error.message);
      else if (mode === "signup") setNotice("Akun dibuat. Cek email Anda untuk konfirmasi.");
      else window.location.href = "/";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
    }
    setStatus("idle");
  }

  async function signIn(provider: "google" | "custom:funikin") {
    setStatus("submitting"); setError("");
    window.location.href = provider === "google" ? "/auth/google" : "/auth/funikin";
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
      <div className="mb-1 text-center">
        <BrandLogo className="mx-auto mb-5 block h-10 sm:h-12" />
        <h2 className="sr-only">{mode === "login" ? "Masuk dengan email" : "Daftar dengan email"}</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-5 text-mute">Buat ruang baru untuk membawa tulisan, data, dan tim Anda bersama.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="email" className="sr-only">Email</label>
        <div className="flex h-12 items-center gap-2.5 rounded-lg bg-gray-50 px-3.5 text-mute shadow-[inset_0_0_0_1px_var(--color-rule)]">
          <FieldIcon type="email" />
          <input id="email" name="email" type="email" required autoComplete="off" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }} placeholder="Email" className="min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-sm !shadow-none placeholder:text-mute focus:!shadow-none" />
        </div>
        <label htmlFor="password" className="sr-only">Password</label>
        <div className="flex h-12 items-center gap-2.5 rounded-lg bg-gray-50 px-3.5 text-mute shadow-[inset_0_0_0_1px_var(--color-rule)]">
          <FieldIcon type="password" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="off" readOnly onFocus={(event) => { event.currentTarget.readOnly = false; }} placeholder="Password" className="min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-sm !shadow-none placeholder:text-mute focus:!shadow-none" />
          <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword((value) => !value)} className="text-xs text-mute hover:text-ink">{showPassword ? "Sembunyikan" : "Lihat"}</button>
        </div>
      </div>

      {mode === "login" && <div className="-mt-1 text-right"><Link href="/lupa-sandi" className="text-xs text-mute hover:text-ink hover:underline">Lupa password?</Link></div>}
      <button type="submit" disabled={status === "submitting"} className="h-12 rounded-lg bg-ink px-4 font-mono text-xs uppercase tracking-widest2 text-white transition-colors hover:bg-gray-700 disabled:opacity-60">{status === "submitting" ? "Memproses…" : mode === "login" ? "Mulai" : "Buat akun"}</button>

      <div className="flex items-center gap-3 py-1 font-mono text-[10px] text-mute"><span className="h-px flex-1 bg-rule" /><span>atau masuk dengan</span><span className="h-px flex-1 bg-rule" /></div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => signIn("google")} aria-label="Masuk dengan Google" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-paper px-3 text-xs text-ink transition hover:bg-gray-50"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z"/><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.54 13.79a5.85 5.85 0 0 1 0-3.58V7.68H3.3a9.74 9.74 0 0 0 0 8.64l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.18c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.28 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.9 9.46 6.18 12 6.18Z"/></svg><span>Google</span></button>
        <button type="button" disabled aria-disabled="true" title="Login FunikIn sementara dinonaktifkan" aria-label="Login FunikIn sementara dinonaktifkan" className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-rule bg-gray-50 px-3 text-xs text-mute opacity-60"><img src="https://www.funikin.com/icon.png" alt="" className="size-5 rounded-full object-cover grayscale" /><span>FunikIn</span></button>
      </div>

      {error && <p className="text-center text-xs text-signal">{error}</p>}
      {notice && <p className="text-center text-xs text-mute">{notice}</p>}
      <p className="pt-1 text-center text-xs text-mute">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}<button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }} className="text-ink underline underline-offset-4">{mode === "login" ? "Daftar" : "Masuk"}</button></p>
    </form>
  );
}

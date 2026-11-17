import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — WARTA.",
  description:
    "Masuk ke akun WARTA. untuk menyimpan artikel dan mengatur langganan.",
};

export default function LoginPage() {
  return (
    <div className="wrap flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">Akun Pembaca</p>
        <h1 className="mt-3 text-center font-display text-display-md">
          Masuk ke WARTA.
        </h1>
        <p className="mt-2 text-center text-sm text-mute">
          Simpan artikel favorit dan atur langganan ringkasan pagi.
        </p>

        <div className="mt-8 rule-thick border-t pt-8">
          <LoginForm />
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-mute">
          <Link href="/" className="hover:text-ink">
            ← Kembali ke Beranda
          </Link>
        </p>
      </div>
    </div>
  );
}

import BrandLogo from "@/app/components/layout/BrandLogo";
import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — ResponKu",
  robots: { index: false, follow: true },
  description:
    "Masuk ke ResponKu untuk membaca, menulis, dan mengikuti perkembangan artikel.",
};

export default function LoginPage() {
  return (
    <div className="wrap flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-2xl border-t-4 border-ink bg-white px-5 py-7 sm:px-9 sm:py-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Masuk ke <BrandLogo />
        </h1>
        <p className="mt-3 text-sm leading-6 text-mute">
          Ikuti kabar terbaru, sampaikan pandangan, dan kelola tulisanmu dalam satu akun.
        </p>

        <div className="mt-6 border-t border-rule pt-6">
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

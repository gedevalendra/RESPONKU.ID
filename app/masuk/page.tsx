import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — ResponKu",
  robots: { index: false, follow: true },
  description:
    "Masuk ke ResponKu untuk membaca, menulis, dan mengikuti perkembangan artikel.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <div className="wrap flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-4xl bg-white px-5 py-7 sm:px-9 sm:py-9">
        <div className="pt-6">
          <LoginForm initialError={searchParams?.error} />
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

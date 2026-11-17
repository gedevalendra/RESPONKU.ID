import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-display-md">
        Halaman tidak ditemukan.
      </h1>
      <p className="mt-3 max-w-md text-mute">
        Artikel yang Anda cari mungkin sudah dipindahkan atau belum pernah ada.
      </p>
      <Link
        href="/"
        className="mt-8 border border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-widest2 hover:bg-ink hover:text-paper transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

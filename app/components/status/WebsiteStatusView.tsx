import BrandLogo from "@/app/components/layout/BrandLogo";

export type DisplayStatus = "takedown" | "maintenance" | "busy";

type Props = {
  status: DisplayStatus;
  message?: string | null;
  /** Path halaman yang sedang dibuka. Kalau kosong, baris "Halaman" disembunyikan dan tombol muat ulang memakai URL saat ini. */
  pathname?: string;
};

// Semua class ditulis utuh (bukan disusun dinamis) supaya terbaca oleh Tailwind.
const statusCopy = {
  takedown: {
    label: "Takedown",
    word: "di-Takedown",
    title: "Website sedang di-Takedown",
    subtitle: "Layanan sedang ditahan oleh pengelola.",
    hint: "Akses publik dihentikan sementara oleh pengelola. Silakan kembali lagi nanti.",
    text: "text-red-600",
    soft: "bg-red-50",
    bar: "bg-red-600",
    dot: "bg-red-500",
    button: "bg-red-600 hover:bg-red-700",
  },
  maintenance: {
    label: "Maintenance",
    word: "Maintenance",
    title: "Website sedang Maintenance",
    subtitle: "Kami sedang melakukan pemeliharaan sistem.",
    hint: "Kami sedang meningkatkan layanan agar lebih stabil. Biasanya tidak akan lama.",
    text: "text-amber-600",
    soft: "bg-amber-50",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  busy: {
    label: "Sibuk",
    word: "Sibuk",
    title: "Website sedang Sibuk",
    subtitle: "Layanan sementara mengalami lonjakan lalu lintas.",
    hint: "Terlalu banyak pengunjung saat ini. Coba muat ulang beberapa saat lagi.",
    text: "text-blue-500",
    soft: "bg-blue-50",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600",
  },
} as const;

export default function WebsiteStatusView({ status, message, pathname }: Props) {
  const copy = statusCopy[status];
  const text = message || copy.subtitle;

  const facts: { label: string; value: string; dot?: boolean }[] = [
    { label: "Status", value: copy.label, dot: true },
    ...(pathname ? [{ label: "Halaman", value: pathname }] : []),
    { label: "Akses admin", value: "Tidak terpengaruh" },
  ];

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative min-h-[calc(100vh-12rem)] bg-paper"
    >
      <div className="wrap py-12 sm:py-16 lg:py-24">
        {/* Hero */}
        <header className="">
          <h1 className="mt-4 font-display text-5xl font-normal leading-[1.02] tracking-tight text-gray-800 sm:text-7xl lg:text-8xl">
            <span className="block">Website sedang</span>
            <span className={`block ${copy.text}`}>{copy.word}</span>
          </h1>
          <a
                href={pathname ?? ""}
                className={`mt-5 inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 ${copy.button}`}
              >
                <i className="bx bx-refresh text-base" aria-hidden="true" />
                Muat ulang
              </a>
        </header>

        <div className="grid gap-14 w-full lg:gap-20">
          <main className=" text-base leading-relaxed sm:text-lg">
            <section className="relative pt-10">
          
              <p className="font-mono text-xs uppercase tracking-widest2 text-mute">
                Sambil menunggu
              </p>
              <ol className="mt-6 w-full divide-y divide-gray-200 border-y border-gray-200 text-gray-600">
                {[
                  "Muat ulang halaman ini setelah beberapa saat.",
                  "Pastikan koneksi internet Anda stabil.",
                  "Artikel dan akun Anda tetap aman, tidak ada data yang hilang.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-5 py-4">
                    <span className={`font-mono text-sm ${copy.text}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </main>
        </div>

      
      </div>
    </section>
  );
}
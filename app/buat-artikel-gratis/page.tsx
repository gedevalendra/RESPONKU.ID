import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "/buat-artikel-gratis",
  "Buat Artikel Gratis dan Kirim ke Redaksi — ResponKu",
  "Pelajari cara menulis dan mengajukan artikel berita gratis di ResponKu, mulai dari menyusun judul dan ringkasan hingga memantau hasil peninjauan.",
);

const steps = [
  ["Buat akun atau masuk", "Masuk ke ResponKu, lalu buka menu Buat Artikel untuk mulai menulis."],
  ["Siapkan naskah", "Tulis judul yang menjelaskan inti berita, ringkasan singkat, dan isi artikel. Cantumkan sumber informasi dan gunakan gambar yang bisa kamu publikasikan."],
  ["Kirim artikel dan pantau statusnya", "Periksa isi naskah dan tautan sumber sebelum dikirim. Hasil peninjauan dan catatan revisi bisa dilihat melalui Riwayat Publish di akunmu."],
];

export default function WriteArticleGuide() {
  return (
    <div className="wrap py-10 sm:py-14">
      <article className="max-w-3xl">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">Buat artikel gratis di ResponKu</h1>
        <p className="mt-4 text-base leading-7 text-mute">
          ResponKu menyediakan ruang bagi pembaca untuk menulis dan mengajukan artikel berita secara gratis. Artikel yang disetujui dapat dibaca publik dan dibagikan melalui tautan.
        </p>
        <Link href="/akun/artikel" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-sm font-medium text-paper hover:bg-gray-700">
          <i className="bx bx-edit text-lg" aria-hidden="true" /> Mulai menulis
        </Link>
        <section className="mt-10 border-t border-rule pt-6" aria-labelledby="writing-steps">
          <h2 id="writing-steps" className="font-display text-2xl">Cara mengirim artikel</h2>
          <ol className="mt-4 divide-y divide-rule">
            {steps.map(([title, description], index) => (
              <li key={title} className="flex gap-4 py-4">
                <span className="text-sm font-semibold text-blue-700" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-mute">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="mt-6 flex flex-wrap gap-4 border-t border-rule pt-4 text-sm text-blue-700">
          <Link href="/artikel" className="hover:underline">Baca artikel berita</Link>
          <Link href="/faq" className="hover:underline">FAQ dan bantuan</Link>
        </div>
      </article>
    </div>
  );
}

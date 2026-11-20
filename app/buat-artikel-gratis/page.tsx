import type { CSSProperties } from "react";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import { Reveal } from "@/app/components/about/AboutMotion";
import "@/app/components/about/AboutMotion";
import "./guide.css";

export const metadata = publicPageMetadata(
  "/buat-artikel-gratis",
  "Ubah Naskah Mentah Menjadi Artikel dengan AI — ResponKu",
  "Pelajari cara memakai AI ResponKu untuk menyusun naskah mentah menjadi artikel terstruktur, menyunting hasilnya, melihat pratinjau, dan mengirimkannya ke redaksi.",
);

const d = (value: string) => ({ "--d": value }) as CSSProperties;

const steps = [
  {
    icon: "bx-log-in-circle",
    title: "Masuk dan buka Editor Artikel",
    description: "Buat akun atau masuk ke ResponKu, kemudian buka Artikel saya. Pilih editor untuk memulai kiriman baru.",
  },
  {
    icon: "bx-file",
    title: "Masukkan naskah mentah",
    description: "Tempel catatan, draf berita, hasil wawancara, atau naskah panjang ke kolom Format bebas dengan AI. Kamu juga bisa mengunggah dokumen melalui tombol unggah.",
  },
  {
    icon: "bx-sparkles",
    title: "Pilih Format dengan AI",
    description: "AI membaca bahan tersebut lalu membantu memisahkan judul, dek, lokasi, paragraf, heading, dan kutipan menjadi struktur artikel yang dapat disunting.",
  },
  {
    icon: "bx-edit-alt",
    title: "Periksa dan sunting hasilnya",
    description: "Pastikan nama, angka, waktu, lokasi, kutipan, dan sumber sudah benar. Tambahkan thumbnail utama, foto pendukung, tautan, atau bagian lain bila diperlukan.",
  },
  {
    icon: "bx-show",
    title: "Cek Live Preview",
    description: "Panel kanan menampilkan gambaran artikel saat dibaca. Gunakan pratinjau untuk mengecek susunan, keterbacaan, dan urutan gambar sebelum dikirim.",
  },
  {
    icon: "bx-paper-plane",
    title: "Kirim untuk ditinjau redaksi",
    description: "Setelah lengkap, kirim artikel untuk review. Status pending, revisi, diterima, atau ditolak dapat dipantau melalui Kiriman saya.",
  },
];

const aiResults = [
  ["bx-heading", "Menyusun calon judul dan ringkasan"],
  ["bx-list-ul", "Memecah naskah menjadi bagian yang rapi"],
  ["bx-map", "Mengenali lokasi dan pembuka berita"],
  ["bx-quote-alt-left", "Memisahkan heading serta kutipan"],
];

const checks = [
  "Cocokkan nama, angka, tanggal, lokasi, dan kutipan dengan sumber asli.",
  "Jangan mengirim data pribadi, informasi rahasia, atau materi yang tidak boleh dipublikasikan.",
  "Gunakan foto milik sendiri atau gambar yang memiliki izin publikasi.",
  "Cantumkan sumber dan konteks agar redaksi dapat memeriksa isi berita.",
];

export default function WriteArticleGuide() {
  return (
    <main>
      <noscript>
        <style>{`.reveal,.hero-fade{opacity:1!important;transform:none!important}.hero-mask>span,.bar-fill,.hero-rule,.check-pop{transform:none!important}`}</style>
      </noscript>

      {/* Hero */}
      <section className="border-b border-rule bg-white">
        <div className="wrap grid gap-12 py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow hero-fade" style={d("0s")}>
              Panduan menulis di ResponKu
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="hero-mask">
                <span style={d("0.1s")}>Ubah naskah mentah</span>
              </span>
              <span className="hero-mask">
                <span style={d("0.22s")}>menjadi artikel terstruktur</span>
              </span>
              <span className="hero-mask">
                <span className="text-blue-500" style={d("0.34s")}>
                  dengan AI
                </span>
              </span>
            </h1>
            <p
              className="hero-fade mt-6 max-w-[56ch] text-base leading-7 text-mute sm:text-lg sm:leading-8"
              style={d("0.65s")}
            >
              Punya catatan, draf, data, atau hasil wawancara yang masih berantakan? Tempel atau unggah bahannya. AI ResponKu membantu menyusunnya menjadi artikel yang siap kamu periksa dan sunting.
            </p>
            <div className="hero-fade mt-8 flex flex-wrap gap-3" style={d("0.8s")}>
              <Link
                href="/akun/artikel"
                className="guide-btn inline-flex min-h-11 items-center gap-2 bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700"
              >
                <i className="bx bx-edit text-lg" aria-hidden="true" /> Buka Editor Artikel
              </Link>
              <a
                href="#cara-kerja"
                className="guide-btn inline-flex min-h-11 items-center border border-rule px-4 text-sm font-medium hover:bg-gray-100"
              >
                Lihat cara kerjanya
              </a>
            </div>
          </div>

          {/* Demo alur: naskah berantakan -> diproses -> artikel rapi */}
          <div
            className="border border-rule bg-gray-50 p-5 sm:p-7"
            aria-label="Ringkasan alur AI"
          >
            <p className="eyebrow hero-fade" style={d("0.4s")}>
              Dari bahan menjadi artikel
            </p>
            <div className="mt-5 flex flex-col items-stretch">
              <div className="hero-fade border border-rule bg-white p-4" style={d("0.6s")}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <i className="bx bx-file-blank text-xl" aria-hidden="true" /> Naskah mentah
                </div>
                <p className="mt-2 text-sm leading-6 text-mute">
                  Catatan acara, data, kutipan narasumber, atau draf yang belum tersusun.
                </p>
              </div>

              <div className="hero-fade flex flex-col items-center py-1" style={d("1s")}>
                <span aria-hidden="true" className="flow-line h-7 w-px" />
                <span className="my-1 flex items-center gap-2 font-mono text-xs uppercase tracking-widest2 text-mute">
                  <i className="bx bx-loader-circle bx-spin" aria-hidden="true" /> Diproses AI
                </span>
                <span aria-hidden="true" className="flow-line h-7 w-px" />
              </div>

              <div
                className="hero-fade border border-gray-800 bg-gray-800 p-4 text-white"
                style={d("1.3s")}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <i className="bx bx-news text-xl" aria-hidden="true" /> Artikel siap disunting
                </div>
                <div className="mt-3 space-y-2" aria-hidden="true">
                  <div className="bar-fill h-2.5 w-4/5 bg-white" style={d("1.6s")} />
                  <div className="bar-fill h-1.5 w-3/5 bg-gray-500" style={d("1.75s")} />
                  <div className="bar-fill h-1.5 w-full bg-gray-600" style={d("1.9s")} />
                  <div className="bar-fill h-1.5 w-11/12 bg-gray-600" style={d("2.05s")} />
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  Judul, dek, lokasi, isi, heading, dan kutipan ditempatkan ke bagian editor.
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-mute">
              <i className="bx bx-info-circle mt-0.5 text-base" aria-hidden="true" /> AI membantu menyusun, bukan menerbitkan otomatis. Kamu tetap memeriksa hasil dan mengirimkannya ke redaksi.
            </p>
          </div>
        </div>
      </section>

      {/* Langkah (urutan nyata, jadi nomor dipertahankan) */}
      <section id="cara-kerja" className="wrap scroll-mt-20 py-14 sm:py-20" aria-labelledby="steps-title">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">Langkah penggunaan</p>
          <h2 id="steps-title" className="mt-2 font-display text-3xl sm:text-4xl">
            Cara membuat artikel dengan AI
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-7 text-mute">
            Kamu dapat menulis dari awal atau menggunakan bahan yang sudah ada. Semua hasil AI tetap bisa diubah melalui panel editor.
          </p>
        </Reveal>

        <ol className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal
              key={step.title}
              as="li"
              delay={(index % 3) * 90}
              className="step-card bg-white p-6 xl:min-h-56"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="step-icon grid size-10 place-items-center bg-gray-100 text-xl text-gray-800">
                  <i className={`bx ${step.icon}`} aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-mute">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-[48ch] text-sm leading-6 text-mute">{step.description}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Yang dibantu AI + pengingat */}
      <section className="border-y border-rule bg-gray-50">
        <div className="wrap grid gap-12 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <Reveal>
              <p className="eyebrow">Yang dibantu AI</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">
                Bukan sekadar merangkum dokumen
              </h2>
              <p className="mt-3 max-w-[52ch] text-base leading-7 text-mute">
                Fitur Format dengan AI mengubah bahan panjang menjadi komponen artikel di editor, sehingga kamu tidak perlu memindahkan setiap bagian secara manual.
              </p>
            </Reveal>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {aiResults.map(([icon, label], index) => (
                <Reveal
                  key={label}
                  as="li"
                  delay={index * 90}
                  className="ai-chip flex min-h-20 items-center gap-3 border border-rule bg-white p-4 text-sm font-medium"
                >
                  <i className={`bx ${icon} text-2xl text-gray-800`} aria-hidden="true" />
                  {label}
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal
            as="section"
            delay={120}
            className="self-start border-l-4 border-gray-800 bg-white p-6 sm:p-8"
          >
            <p className="eyebrow">Sebelum dikirim</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">
              AI dapat keliru. Penulis tetap bertanggung jawab.
            </h2>
            <ul className="mt-6 grid gap-4 text-sm leading-6 text-mute">
              {checks.map((text, index) => (
                <Reveal
                  key={text}
                  as="li"
                  delay={200 + index * 110}
                  className="flex gap-2"
                >
                  <i className="bx bx-check check-pop mt-0.5 text-lg text-ink" aria-hidden="true" />
                  <span>{text}</span>
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap py-14 sm:py-20">
        <Reveal className="flex flex-col gap-6 border border-rule p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="eyebrow">Siap mencoba?</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Mulai dari naskah yang kamu punya
            </h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-6 text-mute">
              Tidak harus rapi. Masukkan bahannya, biarkan AI menyusun struktur awal, lalu sempurnakan dengan pengetahuanmu.
            </p>
          </div>
          <Link
            href="/akun/artikel"
            className="guide-btn inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-gray-800 px-5 text-sm font-medium text-white hover:bg-gray-700"
          >
            <i className="bx bx-sparkles text-lg" aria-hidden="true" /> Format Artikel dengan AI
          </Link>
        </Reveal>
        <Reveal delay={100} className="mt-6 flex flex-wrap gap-6 text-sm text-blue-700">
          <Link href="/artikel" className="guide-link">Lihat artikel yang sudah terbit</Link>
          <Link href="/faq" className="guide-link">FAQ dan bantuan</Link>
        </Reveal>
      </section>
    </main>
  );
}
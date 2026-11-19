import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "/buat-artikel-gratis",
  "Ubah Naskah Mentah Menjadi Artikel dengan AI — ResponKu",
  "Pelajari cara memakai AI ResponKu untuk menyusun naskah mentah menjadi artikel terstruktur, menyunting hasilnya, melihat pratinjau, dan mengirimkannya ke redaksi.",
);

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

export default function WriteArticleGuide() {
  return (
    <main>
      <section className="border-b border-rule bg-white">
        <div className="wrap grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] lg:items-center lg:py-20">
          <div>
            <p className="eyebrow">Panduan menulis di ResponKu</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Ubah naskah mentah menjadi artikel terstruktur dengan AI
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-mute sm:text-lg sm:leading-8">
              Punya catatan, draf, data, atau hasil wawancara yang masih berantakan? Tempel atau unggah bahannya. AI ResponKu membantu menyusunnya menjadi artikel yang siap kamu periksa dan sunting.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/akun/artikel" className="inline-flex min-h-11 items-center gap-2 bg-gray-800 px-4 text-sm font-medium text-white hover:bg-gray-700">
                <i className="bx bx-edit text-lg" aria-hidden="true" /> Buka Editor Artikel
              </Link>
              <a href="#cara-kerja" className="inline-flex min-h-11 items-center border border-rule px-4 text-sm font-medium hover:bg-gray-100">
                Lihat cara kerjanya
              </a>
            </div>
          </div>

          <div className="border border-rule bg-gray-50 p-5 sm:p-7" aria-label="Ringkasan alur AI">
            <p className="eyebrow">Dari bahan menjadi artikel</p>
            <div className="mt-5 grid gap-3">
              <div className="border border-rule bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><i className="bx bx-file-blank text-xl" aria-hidden="true" /> Naskah mentah</div>
                <p className="mt-2 text-sm leading-6 text-mute">Catatan acara, data, kutipan narasumber, atau draf yang belum tersusun.</p>
              </div>
              <div className="flex items-center justify-center gap-2 py-1 font-mono text-xs uppercase tracking-widest2 text-mute">
                <i className="bx bx-loader-circle" aria-hidden="true" /> Diproses AI
              </div>
              <div className="border border-gray-800 bg-gray-800 p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold"><i className="bx bx-news text-xl" aria-hidden="true" /> Artikel siap disunting</div>
                <p className="mt-2 text-sm leading-6 text-gray-300">Judul, dek, lokasi, isi, heading, dan kutipan ditempatkan ke bagian editor.</p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-mute">
              <i className="bx bx-info-circle mt-0.5 text-base" aria-hidden="true" /> AI membantu menyusun, bukan menerbitkan otomatis. Kamu tetap memeriksa hasil dan mengirimkannya ke redaksi.
            </p>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="wrap py-12 sm:py-16" aria-labelledby="steps-title">
        <div className="max-w-3xl">
          <p className="eyebrow">Langkah penggunaan</p>
          <h2 id="steps-title" className="mt-2 font-display text-3xl sm:text-4xl">Cara membuat artikel dengan AI</h2>
          <p className="mt-3 text-base leading-7 text-mute">Kamu dapat menulis dari awal atau menggunakan bahan yang sudah ada. Semua hasil AI tetap bisa diubah melalui panel editor.</p>
        </div>
        <ol className="mt-8 grid border-y border-rule md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-b border-rule p-5 md:border-r xl:min-h-56 xl:p-6 [&:nth-last-child(-n+2)]:md:border-b-0 [&:nth-child(2n)]:md:border-r-0 [&:nth-child(3n)]:xl:border-r-0 [&:nth-child(4)]:xl:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-10 place-items-center bg-gray-100 text-xl text-gray-800"><i className={`bx ${step.icon}`} aria-hidden="true" /></span>
                <span className="font-mono text-xs text-mute">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-rule bg-gray-50">
        <div className="wrap grid gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <p className="eyebrow">Yang dibantu AI</p>
            <h2 className="mt-2 font-display text-3xl">Bukan sekadar merangkum dokumen</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-mute">Fitur Format dengan AI mengubah bahan panjang menjadi komponen artikel di editor, sehingga kamu tidak perlu memindahkan setiap bagian secara manual.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {aiResults.map(([icon, label]) => (
                <li key={label} className="flex min-h-20 items-center gap-3 border border-rule bg-white p-4 text-sm font-medium">
                  <i className={`bx ${icon} text-2xl text-gray-800`} aria-hidden="true" />{label}
                </li>
              ))}
            </ul>
          </div>
          <aside className="border-l-4 border-gray-800 bg-white p-5 sm:p-7" role="note">
            <p className="eyebrow">Sebelum dikirim</p>
            <h2 className="mt-2 font-display text-2xl">AI dapat keliru. Penulis tetap bertanggung jawab.</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-mute">
              <li className="flex gap-2"><i className="bx bx-check mt-0.5 text-lg text-ink" aria-hidden="true" /> Cocokkan nama, angka, tanggal, lokasi, dan kutipan dengan sumber asli.</li>
              <li className="flex gap-2"><i className="bx bx-check mt-0.5 text-lg text-ink" aria-hidden="true" /> Jangan mengirim data pribadi, informasi rahasia, atau materi yang tidak boleh dipublikasikan.</li>
              <li className="flex gap-2"><i className="bx bx-check mt-0.5 text-lg text-ink" aria-hidden="true" /> Gunakan foto milik sendiri atau gambar yang memiliki izin publikasi.</li>
              <li className="flex gap-2"><i className="bx bx-check mt-0.5 text-lg text-ink" aria-hidden="true" /> Cantumkan sumber dan konteks agar redaksi dapat memeriksa isi berita.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="wrap py-12 sm:py-16">
        <div className="flex flex-col gap-6 border border-rule p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="eyebrow">Siap mencoba?</p>
            <h2 className="mt-2 font-display text-3xl">Mulai dari naskah yang kamu punya</h2>
            <p className="mt-2 text-sm leading-6 text-mute">Tidak harus rapi. Masukkan bahannya, biarkan AI menyusun struktur awal, lalu sempurnakan dengan pengetahuanmu.</p>
          </div>
          <Link href="/akun/artikel" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-gray-800 px-5 text-sm font-medium text-white hover:bg-gray-700">
            <i className="bx bx-sparkles text-lg" aria-hidden="true" /> Format Artikel dengan AI
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-5 text-sm text-blue-700">
          <Link href="/artikel" className="hover:underline">Lihat artikel yang sudah terbit</Link>
          <Link href="/faq" className="hover:underline">FAQ dan bantuan</Link>
        </div>
      </section>
    </main>
  );
}

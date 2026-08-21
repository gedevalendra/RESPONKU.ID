import { Article, Category } from "./types";

export const categories: Category[] = [
  "Ekonomi",
  "Teknologi",
  "Politik",
  "Olahraga",
  "Budaya",
];

export const articles: Article[] = [
  {
    id: "1",
    slug: "bank-sentral-tahan-suku-bunga",
    title: "Bank Sentral Tahan Suku Bunga Acuan, Sinyal Pelonggaran Ditunda ke Kuartal Depan",
    dek: "Keputusan ini diambil di tengah tekanan nilai tukar dan inflasi inti yang masih di atas target tahunan.",
    category: "Ekonomi",
    author: "Ratna Widjaya",
    date: "2026-08-21",
    readTime: 6,
    views: 18420,
    featured: true,
    breaking: true,
  },
  {
    id: "2",
    slug: "startup-lokal-perluas-pasar-asia-tenggara",
    title: "Startup Logistik Lokal Perluas Layanan ke Tiga Negara Asia Tenggara",
    dek: "Ekspansi didorong oleh pendanaan seri B senilai USD 40 juta dan permintaan pengiriman lintas batas yang naik tajam.",
    category: "Teknologi",
    author: "Dimas Prakoso",
    date: "2026-08-21",
    readTime: 5,
    views: 9210,
    featured: true,
  },
  {
    id: "3",
    slug: "revisi-anggaran-infrastruktur-disahkan",
    title: "DPR Sahkan Revisi Anggaran Infrastruktur Senilai Rp 42 Triliun",
    dek: "Sebagian besar alokasi diarahkan ke proyek jalan tol trans-Sumatra dan revitalisasi pelabuhan kecil.",
    category: "Politik",
    author: "Farah Amelia",
    date: "2026-08-20",
    readTime: 4,
    views: 7040,
    featured: true,
  },
  {
    id: "4",
    slug: "timnas-lolos-putaran-final",
    title: "Timnas Lolos ke Putaran Final Usai Menang Dramatis di Menit Akhir",
    dek: "Gol penalti pada masa injury time memastikan tiket ke putaran final untuk pertama kalinya dalam satu dekade.",
    category: "Olahraga",
    author: "Yoga Saputra",
    date: "2026-08-20",
    readTime: 3,
    views: 24310,
  },
  {
    id: "5",
    slug: "pameran-arsip-fotografi-kolonial",
    title: "Pameran Arsip Fotografi Era Kolonial Dibuka untuk Publik Bulan Ini",
    dek: "Ratusan negatif film yang belum pernah dipamerkan dipulihkan oleh tim konservasi selama dua tahun terakhir.",
    category: "Budaya",
    author: "Nadia Kusuma",
    date: "2026-08-19",
    readTime: 7,
    views: 3120,
  },
  {
    id: "6",
    slug: "rupiah-menguat-tipis",
    title: "Rupiah Menguat Tipis Ditopang Aliran Modal Asing ke Pasar Obligasi",
    dek: "Investor asing mencatatkan pembelian bersih obligasi pemerintah untuk hari ketiga berturut-turut.",
    category: "Ekonomi",
    author: "Ratna Widjaya",
    date: "2026-08-19",
    readTime: 4,
    views: 5210,
  },
  {
    id: "7",
    slug: "regulasi-ai-diusulkan-kominfo",
    title: "Kementerian Ajukan Kerangka Regulasi Baru untuk Sistem AI Publik",
    dek: "Draf aturan mewajibkan audit independen untuk sistem AI yang digunakan dalam layanan pemerintahan.",
    category: "Teknologi",
    author: "Dimas Prakoso",
    date: "2026-08-18",
    readTime: 5,
    views: 11020,
  },
  {
    id: "8",
    slug: "gubernur-baru-lantik-kabinet-daerah",
    title: "Gubernur Terpilih Lantik Kabinet Daerah, Prioritaskan Layanan Kesehatan",
    dek: "Sembilan kepala dinas baru dilantik dengan mandat khusus memangkas waktu tunggu layanan puskesmas.",
    category: "Politik",
    author: "Farah Amelia",
    date: "2026-08-18",
    readTime: 4,
    views: 4310,
  },
  {
    id: "9",
    slug: "liga-lokal-catat-rekor-penonton",
    title: "Liga Sepak Bola Lokal Catat Rekor Penonton Stadion Musim Ini",
    dek: "Rata-rata kehadiran penonton naik 38 persen dibanding musim lalu, tertinggi sejak liga direformasi.",
    category: "Olahraga",
    author: "Yoga Saputra",
    date: "2026-08-17",
    readTime: 3,
    views: 8720,
  },
  {
    id: "10",
    slug: "penulis-muda-menang-penghargaan-sastra",
    title: "Penulis Muda Raih Penghargaan Sastra Nasional untuk Novel Debut",
    dek: "Novel yang ditulis selama masa pandemi ini mengangkat kisah migrasi buruh dari desa ke kota industri.",
    category: "Budaya",
    author: "Nadia Kusuma",
    date: "2026-08-17",
    readTime: 6,
    views: 2890,
  },
  {
    id: "11",
    slug: "harga-komoditas-ekspor-naik",
    title: "Harga Komoditas Ekspor Unggulan Naik, Neraca Dagang Diproyeksi Membaik",
    dek: "Kenaikan harga sawit dan nikel olahan menjadi penopang utama surplus dagang bulan ini.",
    category: "Ekonomi",
    author: "Ratna Widjaya",
    date: "2026-08-16",
    readTime: 5,
    views: 6130,
  },
  {
    id: "12",
    slug: "perusahaan-chip-lokal-mulai-produksi",
    title: "Perusahaan Rintisan Semikonduktor Lokal Mulai Produksi Chip Perdana",
    dek: "Fasilitas produksi tahap awal menyasar kebutuhan chip untuk perangkat IoT skala kecil.",
    category: "Teknologi",
    author: "Dimas Prakoso",
    date: "2026-08-16",
    readTime: 5,
    views: 7940,
  },
];

export const breakingHeadlines: string[] = articles
  .filter((a) => a.breaking)
  .map((a) => a.title)
  .concat([
    "Harga BBM subsidi tetap tak berubah hingga akhir bulan",
    "Gempa magnitudo 4.8 guncang wilayah selatan, tidak berpotensi tsunami",
    "Indeks harga saham gabungan ditutup menguat 0,8 persen",
  ]);

export function getFeatured(): Article[] {
  return articles.filter((a) => a.featured);
}

export function getTrending(limit = 5): Article[] {
  return [...articles].sort((a, b) => b.views - a.views).slice(0, limit);
}

export function getByCategory(category: Category, limit?: number): Article[] {
  const list = articles.filter((a) => a.category === category);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatViews(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}rb`;
  }
  return `${n}`;
}

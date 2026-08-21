import { Article, Category } from "./types";

export const categories: Category[] = [
  "Ekonomi",
  "Teknologi",
  "Politik",
  "Olahraga",
  "Budaya",
];

export const categorySlug: Record<Category, string> = {
  Ekonomi: "ekonomi",
  Teknologi: "teknologi",
  Politik: "politik",
  Olahraga: "olahraga",
  Budaya: "budaya",
};

export const slugToCategory: Record<string, Category> = Object.fromEntries(
  Object.entries(categorySlug).map(([category, slug]) => [slug, category as Category])
);

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
    content: [
      "Bank sentral memutuskan menahan suku bunga acuan pada level saat ini, membatalkan ekspektasi pasar yang sebelumnya memperkirakan pemangkasan pada kuartal ini. Keputusan tersebut diambil dalam rapat dewan gubernur yang berlangsung dua hari dan diumumkan melalui konferensi pers sore ini.",
      "Gubernur bank sentral menyebut tekanan nilai tukar rupiah dan inflasi inti yang masih berada di atas titik tengah target tahunan sebagai pertimbangan utama. \"Ruang untuk pelonggaran belum cukup lebar,\" katanya, seraya menambahkan bahwa bank sentral akan terus memantau data inflasi bulan berjalan sebelum mengambil langkah lanjutan.",
      "Pelaku pasar merespons keputusan ini dengan beragam. Sejumlah analis menilai sikap hati-hati tersebut wajar mengingat volatilitas pasar keuangan global belakangan ini, sementara sebagian pelaku usaha berharap suku bunga segera turun untuk mendorong permintaan kredit yang melambat sejak awal tahun.",
      "Bank sentral mengisyaratkan peninjauan berikutnya akan dilakukan pada pertemuan kuartal depan, dengan kemungkinan pelonggaran tetap terbuka apabila tekanan inflasi mereda dan nilai tukar stabil dalam rentang yang lebih sehat.",
    ],
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
    content: [
      "Sebuah startup logistik asal dalam negeri mengumumkan perluasan layanan pengiriman lintas batas ke tiga negara tetangga di Asia Tenggara, menyusul rampungnya putaran pendanaan seri B senilai USD 40 juta yang dipimpin sejumlah investor modal ventura regional.",
      "Perusahaan menyebut ekspansi ini didorong oleh lonjakan permintaan pengiriman lintas negara dari pelaku usaha kecil dan menengah yang semakin banyak berjualan ke pasar regional lewat platform daring. Jaringan gudang transit baru akan dibangun di titik-titik distribusi utama pada masing-masing negara tujuan.",
      "Selain memperluas jaringan fisik, dana segar tersebut juga akan dialokasikan untuk pengembangan sistem pelacakan pengiriman berbasis data dan penambahan tenaga kerja lapangan di negara-negara baru tersebut.",
      "Manajemen menargetkan operasional penuh di ketiga negara dapat berjalan dalam dua kuartal ke depan, dengan volume pengiriman lintas batas diproyeksikan tumbuh signifikan dibanding tahun sebelumnya.",
    ],
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
    content: [
      "Dewan Perwakilan Rakyat mengesahkan revisi anggaran infrastruktur senilai Rp 42 triliun dalam rapat paripurna hari ini, menambah alokasi yang sebelumnya telah ditetapkan dalam anggaran tahun berjalan.",
      "Sebagian besar tambahan anggaran diarahkan pada proyek jalan tol trans-Sumatra yang sempat tertunda akibat pembebasan lahan, serta program revitalisasi pelabuhan-pelabuhan kecil di kawasan timur yang dinilai vital bagi distribusi logistik antarpulau.",
      "Sejumlah anggota dewan dari fraksi oposisi mempertanyakan skema pembiayaan tambahan tersebut dan meminta kementerian terkait memberikan laporan progres secara berkala agar penyerapan anggaran tidak menumpuk di akhir tahun seperti pola tahun-tahun sebelumnya.",
      "Kementerian terkait menyatakan pekerjaan fisik di lapangan akan mulai berjalan pada bulan depan, dengan target sebagian ruas jalan tol dapat difungsikan secara bertahap sebelum akhir tahun anggaran.",
    ],
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
    content: [
      "Tim nasional memastikan tiket ke putaran final setelah menang dramatis lewat gol penalti pada masa injury time, mengakhiri penantian panjang selama satu dekade untuk kembali tampil di panggung tersebut.",
      "Pertandingan berjalan ketat sejak menit awal, dengan kedua tim saling menciptakan peluang tanpa hasil hingga babak kedua. Pelanggaran di kotak penalti pada menit-menit akhir menjadi titik balik yang akhirnya menentukan hasil pertandingan.",
      "Pelatih tim nasional memuji ketenangan pemain dalam menghadapi tekanan di menit-menit krusial, sekaligus menyebut kelolosan ini sebagai hasil kerja keras program pembinaan jangka panjang yang mulai membuahkan hasil.",
      "Federasi sepak bola nasional dijadwalkan mengumumkan susunan skuad untuk putaran final dalam beberapa pekan mendatang, seiring persiapan pemusatan latihan yang akan segera dimulai.",
    ],
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
    content: [
      "Pameran arsip fotografi era kolonial resmi dibuka untuk publik bulan ini, menampilkan ratusan negatif film yang belum pernah dipamerkan sebelumnya kepada khalayak umum.",
      "Tim konservasi menghabiskan waktu dua tahun untuk memulihkan negatif-negatif film tersebut, yang sebagian besar ditemukan dalam kondisi rapuh di gudang arsip daerah. Proses digitalisasi dilakukan secara hati-hati agar detail visual pada bidikan aslinya tetap terjaga.",
      "Kurator pameran menyebut koleksi ini penting sebagai catatan visual kehidupan sehari-hari masyarakat pada masa tersebut, yang selama ini lebih banyak didokumentasikan lewat catatan tertulis ketimbang gambar.",
      "Pameran akan berlangsung selama satu bulan penuh dan terbuka gratis bagi publik, dengan sesi kunjungan berpemandu yang disediakan pada akhir pekan.",
    ],
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
    content: [
      "Nilai tukar rupiah menguat tipis terhadap dolar Amerika Serikat pada penutupan perdagangan hari ini, ditopang oleh aliran modal asing yang kembali masuk ke pasar obligasi pemerintah.",
      "Data otoritas bursa mencatat investor asing membukukan pembelian bersih obligasi negara untuk hari ketiga berturut-turut, mengindikasikan pemulihan sentimen terhadap aset domestik setelah tekanan jual beberapa pekan terakhir.",
      "Analis pasar uang menilai penguatan ini masih rentan berbalik arah bila muncul kejutan data ekonomi global, khususnya dari kebijakan bank sentral negara maju yang menjadi acuan arus modal internasional.",
      "Meski demikian, pelaku pasar domestik cenderung optimistis stabilitas nilai tukar dapat terjaga hingga akhir bulan seiring membaiknya neraca perdagangan nasional.",
    ],
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
    content: [
      "Kementerian yang membidangi urusan komunikasi dan informatika mengajukan kerangka regulasi baru untuk mengatur penggunaan sistem kecerdasan buatan pada layanan publik, menyusul meningkatnya adopsi teknologi tersebut di berbagai instansi pemerintah.",
      "Draf aturan tersebut mewajibkan audit independen secara berkala bagi setiap sistem AI yang digunakan dalam layanan pemerintahan, termasuk ketentuan transparansi mengenai data yang dipakai untuk melatih model yang bersangkutan.",
      "Sejumlah pegiat kebijakan digital menyambut baik langkah ini namun meminta agar mekanisme audit tidak menjadi beban administratif berlebihan bagi instansi dengan kapasitas teknis terbatas, terutama di tingkat daerah.",
      "Kementerian menargetkan draf regulasi dapat rampung dan mulai dikonsultasikan publik dalam beberapa bulan mendatang sebelum ditetapkan secara resmi.",
    ],
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
    content: [
      "Gubernur terpilih resmi melantik sembilan kepala dinas baru dalam kabinet daerah, dengan mandat khusus untuk memangkas waktu tunggu layanan kesehatan tingkat pertama di puskesmas-puskesmas wilayah.",
      "Dalam sambutan pelantikan, gubernur menekankan bahwa evaluasi kinerja kepala dinas akan dilakukan setiap triwulan, dengan indikator utama berupa kepuasan masyarakat terhadap layanan publik dasar.",
      "Kepala dinas kesehatan yang baru dilantik menyampaikan rencana penambahan tenaga medis di puskesmas-puskesmas dengan rasio pasien tertinggi sebagai prioritas seratus hari pertama masa jabatannya.",
      "Sejumlah kalangan menyambut baik prioritas ini, meski mengingatkan bahwa perbaikan layanan kesehatan daerah juga membutuhkan dukungan anggaran yang memadai dari pemerintah pusat.",
    ],
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
    content: [
      "Liga sepak bola lokal mencatatkan rekor rata-rata penonton stadion tertinggi sejak kompetisi tersebut direformasi, dengan kenaikan kehadiran penonton sebesar 38 persen dibanding musim sebelumnya.",
      "Pengelola liga menyebut perbaikan fasilitas stadion dan jadwal pertandingan yang lebih ramah penonton keluarga menjadi faktor utama pendorong lonjakan kehadiran tersebut, selain membaiknya kualitas pertandingan di lapangan.",
      "Sejumlah klub peserta liga turut merasakan dampak positif dari sisi pendapatan tiket dan merchandise, yang oleh beberapa manajemen klub disebut sebagai pertanda sehatnya minat publik terhadap kompetisi domestik.",
      "Liga menargetkan tren kenaikan penonton ini dapat berlanjut pada musim depan, seiring rencana renovasi tambahan pada sejumlah stadion yang belum memenuhi standar kenyamanan penonton.",
    ],
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
    content: [
      "Seorang penulis muda meraih penghargaan sastra nasional untuk novel debutnya, yang mengangkat kisah migrasi buruh dari desa ke kota industri selama masa pandemi.",
      "Novel tersebut ditulis penulis selama masa karantina, berdasarkan riset lapangan dan wawancara dengan sejumlah buruh migran yang kembali ke kampung halaman akibat kehilangan pekerjaan di kota.",
      "Dewan juri menilai karya ini berhasil menghadirkan sudut pandang yang jarang diangkat dalam sastra kontemporer, dengan gaya penulisan yang jujur tanpa berlebihan dalam menggambarkan kesulitan tokoh-tokohnya.",
      "Penulis menyatakan penghargaan ini menjadi dorongan untuk melanjutkan proyek penulisan berikutnya yang masih akan mengangkat tema serupa seputar mobilitas sosial masyarakat pekerja.",
    ],
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
    content: [
      "Harga sejumlah komoditas ekspor unggulan tercatat naik dalam sebulan terakhir, dengan neraca perdagangan nasional diproyeksikan membaik seiring kontribusi dari kenaikan harga tersebut.",
      "Kenaikan harga sawit dan nikel olahan menjadi penopang utama surplus dagang, di tengah permintaan global yang mulai pulih setelah melambat pada beberapa kuartal sebelumnya.",
      "Pelaku usaha di sektor komoditas menyambut baik tren ini, meski mengingatkan bahwa harga komoditas cenderung fluktuatif dan dipengaruhi banyak faktor eksternal yang sulit diprediksi dalam jangka panjang.",
      "Pemerintah menyebut akan terus memantau perkembangan harga komoditas global sembari mendorong hilirisasi lebih lanjut agar nilai tambah ekspor tidak hanya bergantung pada harga bahan mentah.",
    ],
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
    content: [
      "Sebuah perusahaan rintisan semikonduktor lokal memulai produksi chip perdana di fasilitas produksinya, menandai langkah awal industri chip dalam negeri yang selama ini bergantung penuh pada impor.",
      "Fasilitas produksi tahap awal ini menyasar kebutuhan chip untuk perangkat internet of things (IoT) berskala kecil, seperti sensor rumah pintar dan perangkat pemantauan industri ringan.",
      "Manajemen perusahaan menyebut kapasitas produksi awal masih terbatas, namun akan ditingkatkan secara bertahap seiring bertambahnya permintaan dari produsen perangkat elektronik dalam negeri.",
      "Kalangan industri menilai langkah ini sebagai awal yang penting bagi kemandirian rantai pasok elektronik nasional, meski jalan menuju produksi chip skala besar masih membutuhkan investasi dan waktu yang panjang.",
    ],
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

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelated(article: Article, limit = 3): Article[] {
  return articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, limit);
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

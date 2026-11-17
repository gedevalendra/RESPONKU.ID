export type AboutSectionType = "text" | "highlight" | "cards" | "list";
export type AboutItem = { id: string; title: string; text: string };
export type AboutSection = {
  id: string;
  type: AboutSectionType;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  items?: AboutItem[];
  listItems?: string[];
};
export type AboutPage = {
  title: string;
  intro: string;
  sidebarTitle: string;
  sidebarText: string;
  sections: AboutSection[];
  updatedAt?: string;
};

export const defaultAboutPage: AboutPage = {
  title: "Media yang memberi ruang bagi suara yang sering tidak terdengar.",
  intro:
    "ResponKu adalah media independen yang dibangun untuk menghadirkan berita secara jelas, berani, dan bertanggung jawab—dengan perhatian khusus pada isu yang berdampak langsung terhadap kehidupan masyarakat.",
  sidebarTitle: "Kabar yang tidak berhenti pada suara paling keras.",
  sidebarText:
    "Punya cerita yang penting untuk diketahui? Masuk ke akun dan susun artikelmu. Redaksi akan memeriksa naskah sebelum diterbitkan.",
  sections: [
    {
      id: "sejarah",
      type: "text",
      eyebrow: "01 / Awal perjalanan",
      title: "Dibangun dari kebutuhan untuk merespons",
      paragraphs: [
        "ResponKu didirikan pada 17 November 2026 oleh Gede Valendra. Ia membangun ResponKu dari sebuah kegelisahan sederhana: banyak peristiwa penting terjadi di sekitar kita, tetapi tidak semuanya memperoleh ruang pemberitaan yang layak.",
        "Di tengah arus informasi yang semakin cepat, masyarakat membutuhkan media yang tidak hanya mengejar kecepatan, tetapi juga bersedia memeriksa konteks, mendengar suara yang berbeda, dan menjelaskan mengapa sebuah peristiwa penting bagi publik. Dari kebutuhan itulah ResponKu tumbuh sebagai ruang berita digital yang terbuka untuk pembaca sekaligus kontributor.",
        "Nama ResponKu membawa gagasan bahwa berita bukan komunikasi satu arah. Setiap pembaca memiliki pengalaman, pertanyaan, dan respons terhadap keadaan di sekitarnya. Media seharusnya tidak memonopoli percakapan, melainkan membantu masyarakat memahami persoalan dan ikut menyuarakan hal-hal yang relevan.",
      ],
    },
    {
      id: "funikin",
      type: "highlight",
      eyebrow: "02 / Bagian dari FunikIn",
      title: "ResponKu dan ekosistem FunikIn",
      paragraphs: [
        "ResponKu merupakan bagian dari FunikIn, sebuah ekosistem digital yang menjadi rumah bagi pengembangan produk, komunitas, dan layanan berbasis teknologi. Hubungan ini memberikan dukungan infrastruktur dan pengembangan tanpa menghilangkan identitas serta arah editorial ResponKu.",
        "FunikIn membantu ResponKu membangun pengalaman digital yang lebih aman, mudah diakses, dan terbuka bagi masyarakat. Sementara itu, ResponKu tetap menjalankan fungsi medianya dengan tanggung jawab editorial sendiri: memeriksa naskah, menjaga kualitas informasi, serta mengutamakan kepentingan publik.",
        "ResponKu adalah media di dalam ekosistem FunikIn, tetapi ruang redaksionalnya diarahkan untuk tetap kritis, transparan, dan independen.",
      ],
    },
    {
      id: "independensi",
      type: "text",
      eyebrow: "03 / Mengapa ResponKu ada",
      title: "Menyuarakan yang terlalu sering disisihkan",
      paragraphs: [
        "ResponKu lahir dari keyakinan bahwa media tidak seharusnya hanya menyampaikan apa yang nyaman untuk didengar. Kami ingin memberi perhatian pada isu, pengalaman, dan pertanyaan yang selama ini kerap dibungkam, dikecilkan, atau tidak mendapat ruang karena media tertentu harus tunduk pada kepentingan atasan, pemilik, pengiklan, atau kekuasaan.",
        "Keberanian editorial tidak berarti bebas dari tanggung jawab. Kritik harus memiliki dasar. Kesaksian harus diperlakukan dengan hati-hati. Tuduhan harus diverifikasi. Pihak yang diberitakan tetap berhak memberikan tanggapan. ResponKu ingin membuka ruang yang lebih berani tanpa mengorbankan akurasi, keselamatan, dan martabat manusia.",
        "Kami tidak menjanjikan bahwa setiap tulisan akan diterbitkan atau bahwa semua pandangan akan dianggap benar. Yang kami janjikan adalah proses yang lebih terbuka: naskah dibaca, informasi diperiksa sebisanya, dan keputusan editorial diambil berdasarkan kepentingan publik serta ketentuan yang dapat dijelaskan.",
      ],
    },
    {
      id: "prinsip",
      type: "cards",
      eyebrow: "04 / Prinsip kerja",
      title: "Cara kami menjaga kepercayaan",
      paragraphs: [],
      items: [
        {
          id: "independen",
          title: "Kemandirian editorial",
          text: "Keputusan redaksional berdiri di atas kepentingan publik, bukan tekanan pemilik modal, pengiklan, pejabat, atau pihak yang ingin mengatur arah pemberitaan.",
        },
        {
          id: "warga",
          title: "Ruang untuk suara warga",
          text: "Pengalaman warga, saksi mata, komunitas, dan penulis independen dapat memperkaya berita selama disampaikan dengan itikad baik dan dapat diverifikasi.",
        },
        {
          id: "konteks",
          title: "Konteks sebelum sensasi",
          text: "Berita tidak berhenti pada judul. Kami mendorong tulisan yang menjelaskan latar belakang, dampak, data, dan pihak yang berkaitan.",
        },
        {
          id: "koreksi",
          title: "Koreksi adalah tanggung jawab",
          text: "Kami menyediakan ruang untuk klarifikasi, pembaruan, dan koreksi yang transparan ketika informasi baru atau bukti yang lebih kuat tersedia.",
        },
      ],
    },
    {
      id: "kontributor",
      type: "text",
      eyebrow: "05 / Menulis di ResponKu",
      title: "Semua orang dapat berkontribusi secara gratis",
      paragraphs: [
        "ResponKu membuka kesempatan bagi siapa saja untuk membuat dan mengirim artikel tanpa dipungut biaya. Pembaca, mahasiswa, pekerja, komunitas, saksi peristiwa, dan warga biasa dapat menyampaikan pengalaman atau analisisnya melalui editor artikel setelah masuk ke akun.",
        "Kontribusi gratis ini bukan berarti tulisan otomatis terbit. Setiap artikel tetap masuk ke antrean pemeriksaan redaksi. Redaksi dapat meminta perbaikan, memeriksa sumber, menyunting judul atau struktur, menunda penerbitan, atau menolak tulisan apabila tidak memenuhi standar publikasi.",
        "Tidak ada biaya untuk mengirim artikel dan tidak ada biaya tersembunyi untuk dipublikasikan. ResponKu juga tidak menjual prioritas penerbitan. Prioritas editorial ditentukan berdasarkan urgensi, kepentingan publik, kelengkapan informasi, dan relevansi peristiwa.",
      ],
    },
    {
      id: "prioritas",
      type: "highlight",
      eyebrow: "06 / Prioritas publik",
      title: "Isu mendesak dapat diproses lebih cepat",
      paragraphs: [
        "Artikel mengenai aksi unjuk rasa, demonstrasi, gejolak pemerintahan, kebijakan publik yang berdampak luas, bencana, keselamatan warga, pelanggaran hak, atau peristiwa yang sedang berlangsung dapat memperoleh prioritas pemeriksaan apabila informasinya relevan dan cukup dapat diverifikasi.",
        "Prioritas ini bukan jaminan pasti terbit dan bukan jalur untuk melewati pemeriksaan fakta. Naskah tetap harus memenuhi standar keamanan, akurasi, dan etika. Dalam situasi yang berubah cepat, redaksi dapat meminta lokasi, waktu kejadian, dokumentasi, kontak saksi, atau sumber tambahan.",
        "Untuk isu yang sedang berkembang, pembaruan informasi dapat dilakukan secara bertahap dengan keterangan yang jelas bahwa informasi masih berkembang.",
      ],
    },
    {
      id: "ketentuan",
      type: "list",
      eyebrow: "07 / Ketentuan kontribusi",
      title: "Agar tulisan dapat diproses dengan baik",
      paragraphs: [],
      listItems: [
        "Tulisan harus orisinal, tidak menjiplak, dan tidak sedang diterbitkan secara eksklusif di media lain tanpa izin.",
        "Informasi harus disampaikan berdasarkan fakta, pengalaman langsung, dokumen, data, atau sumber yang dapat dijelaskan.",
        "Penulis wajib membedakan fakta, opini, dugaan, dan kesimpulan pribadi secara jelas.",
        "Tuduhan terhadap individu, lembaga, atau kelompok harus memiliki dasar yang masuk akal dan memberi kesempatan untuk klarifikasi.",
        "Artikel tidak boleh memuat fitnah, doxing, ancaman, ujaran kebencian, diskriminasi, pornografi, atau ajakan melakukan kekerasan.",
        "ResponKu dapat meminta bukti tambahan, melakukan penyuntingan, menunda, menolak, atau menghapus artikel yang melanggar ketentuan.",
      ],
    },
    {
      id: "transparansi",
      type: "text",
      eyebrow: "08 / Transparansi redaksi",
      title: "Hak pembaca dan penulis",
      paragraphs: [
        "Penulis berhak mengetahui apabila naskahnya membutuhkan perbaikan atau ditolak karena alasan editorial. Pembaca berhak menyampaikan koreksi, klarifikasi, atau keberatan terhadap informasi yang dipublikasikan.",
        "ResponKu dapat memperbarui artikel setelah publikasi apabila terdapat koreksi faktual, perkembangan penting, atau tanggapan dari pihak terkait. Perubahan material sebaiknya diberi keterangan agar pembaca dapat memahami riwayat pembaruan informasi.",
        "Kami juga berusaha melindungi identitas sumber yang rentan, sepanjang perlindungan tersebut tidak digunakan untuk menyebarkan informasi palsu atau tuduhan tanpa dasar.",
      ],
    },
  ],
};

export function normalizeAboutPage(
  value: Partial<AboutPage> | null | undefined,
): AboutPage {
  return {
    ...defaultAboutPage,
    ...value,
    sections: value?.sections?.length
      ? value.sections
      : defaultAboutPage.sections,
  };
}

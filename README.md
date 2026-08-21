# WARTA. — Landing Page Website Berita

Landing page untuk situs berita minimalis hitam-putih, dibangun dengan Next.js (App Router) + TypeScript + Tailwind CSS.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Konsep desain

- **Palet**: nyaris monokrom murni — `ink #111110`, `paper #FAFAF7`, `rule #DEDDD5` (garis tipis), `mute #6E6D66` (teks sekunder). Satu-satunya aksen warna adalah `signal #C6402A`, dipakai sangat terbatas hanya untuk label "Breaking" — konvensi tinta merah kantor berita klasik, bukan dekorasi.
- **Tipografi**: `Newsreader` (serif) untuk headline agar terasa editorial, `Inter` untuk teks isi, `JetBrains Mono` untuk semua metadata (tanggal, kategori, edisi, penulis) — memberi nuansa "wire service"/teleprinter pada data teknis, membedakannya dari prosa.
- **Elemen tanda tangan (signature)**: nameplate/masthead ala koran cetak (nama besar + strip meta tanggal/edisi + garis tebal-tipis) yang diikuti ticker berita berjalan (`TickerBar`). Ini bukan hiasan generik — meniru struktur halaman depan koran fisik yang memang relevan untuk subjek berita.
- Tidak ada gradient dekoratif, tidak ada rounded-corner kartu ala SaaS, tidak ada bayangan lembut generik. Foto artikel digantikan placeholder duotone (`photo-tone`) karena belum ada foto asli — silakan ganti dengan `<Image>` dari `next/image` saat foto tersedia.

## Struktur folder

```
app/
  layout.tsx          # font, <Header/> + <Footer/> global
  page.tsx             # landing page
  globals.css          # token warna, utility .eyebrow/.wrap/.photo-tone, focus-visible
components/
  layout/
    Header.tsx         # meta strip + nameplate + nav kategori + MobileNav + TickerBar
    MobileNav.tsx       # drawer menu untuk mobile (client component)
    Sidebar.tsx         # trending + kanal + newsletter, dipakai di landing & (nanti) halaman artikel
    Footer.tsx
  landing/
    HeroSection.tsx     # lead story + 2 secondary story
    ArticleCard.tsx     # variant "row" (list) & "stacked" (grid kategori)
    CategoryBadge.tsx
    SectionHeading.tsx
    SectionGrid.tsx     # heading + grid ArticleCard per kategori
    TrendingList.tsx    # ranking terpopuler, angka urut bermakna
    NewsletterForm.tsx
    TickerBar.tsx       # marquee breaking news, dihormati prefers-reduced-motion
lib/
  types.ts
  data.ts               # dummy artikel + helper (getFeatured, getTrending, getByCategory, dst)
```

## Yang belum dibuat (langkah lanjutan)

Halaman `/artikel/[slug]` dan `/kategori/[slug]` sudah ditautkan dari komponen (Header, Footer, ArticleCard, Sidebar) tapi route-nya belum dibuat — beri tahu saya kalau mau saya lanjutkan.

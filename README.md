# WARTA. — Landing Page Website Berita

Landing page untuk situs berita minimalis hitam-putih, dibangun dengan Next.js (App Router) + TypeScript + Tailwind CSS.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Database

Project ini memakai dua penyimpanan dengan tanggung jawab terpisah:

- Supabase/Postgres + Realtime: komentar, reaksi artikel, newsletter, bookmark, dan sesi auth.
- MongoDB: artikel, arsip konten besar, event view, dan index pencarian/statistik.

Salin `.env.example` menjadi `.env.local`, lalu isi kredensial secara manual. Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` atau `MONGODB_URI` ke client-side code.

1. Jalankan isi [`supabase/schema.sql`](supabase/schema.sql) di Supabase SQL Editor.
2. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`.
3. Isi `MONGODB_URI` dan `MONGODB_DB_NAME`, lalu jalankan `npm run db:indexes`.
4. Masukkan dokumen artikel ke collection `articles`. Bentuknya mengikuti `Article` di `lib/types.ts`.
5. Isi `SUPERADMIN_EMAIL=admin@responku.id` dan `SUPERADMIN_PASSWORD=admin123` hanya di `.env.local`, lalu jalankan `npm run auth:seed-superadmin`. Segera ganti password setelah login pertama.

Endpoint yang tersedia:

- `GET/POST /api/comments` untuk membaca dan mengirim komentar. Moderasi dikendalikan `COMMENTS_REQUIRE_MODERATION`.
- `GET/POST /api/reactions` untuk ringkasan dan reaksi unik per pengunjung.
- `POST /api/newsletter` untuk pendaftaran newsletter.
- `POST /api/articles/:slug/view` untuk mencatat view ke MongoDB.
- `GET /api/health` untuk memeriksa apakah env service sudah terdeteksi.

Panel tersedia di `/admin` untuk admin/superadmin dan `/akun/artikel` untuk user. User hanya dapat membuat, mengubah, dan menghapus artikelnya sendiri; setiap artikel user otomatis berstatus `pending`. Admin dapat menerbitkan atau menolak kiriman. Superadmin dapat mengatur role seluruh user.

Tanpa env database, aplikasi tetap menampilkan artikel demo dan interaksi database memberi status konfigurasi yang jelas; tidak ada kredensial yang dibuat otomatis.

### Login manual, OAuth, dan akun FunikIn

Halaman `/masuk` sudah mendukung email/password (masuk dan daftar), Google, GitHub, serta tombol akun FunikIn. Supabase Auth menyimpan sesi melalui cookie SSR menggunakan `@supabase/ssr`; callback aplikasi berada di `/auth/callback`.

Untuk login email/password dan data realtime, isi kredensial Supabase. Google dan FunikIn tidak lagi memakai Supabase Auth; keduanya memakai direct OAuth server-side.

```text
http://localhost:3000/auth/callback
https://domain-anda.com/auth/callback
```

Untuk Google direct OAuth, masukkan Client ID dan Client Secret ke `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env.local`. Di Google Cloud, gunakan Authorized redirect URI `http://localhost:3000/auth/google/callback` dan `https://www.responku.id/auth/google/callback`. Jangan menyimpan file `client_secret_*.json` atau secret Google di Git.

Untuk menjadikan akun FunikIn sebagai login bersama, FunikIn harus menyediakan OAuth2 atau OIDC. Pada mode hybrid, isi endpoint FunikIn langsung di `.env.local`: authorization URL, token URL, userinfo URL, client ID, dan client secret. Redirect/callback yang didaftarkan di FunikIn adalah `/auth/funikin/callback`.

Jika FunikIn belum memiliki OAuth/OIDC, perlu dibuat dulu endpoint standar tersebut di web utama. Jangan mengirim client secret FunikIn ke browser; kredensial provider hanya dibaca server-side.

Google dan FunikIn sekarang menggunakan direct OAuth hybrid melalui `/auth/google` dan `/auth/funikin`; login email/password tetap menggunakan Supabase Auth. Direct OAuth memerlukan `OAUTH_SESSION_SECRET`, kredensial Google server-side, serta endpoint OAuth FunikIn di `.env.local`. Callback direct-nya adalah `/auth/google/callback` dan `/auth/funikin/callback`.

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

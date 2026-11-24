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

### Login via FunikIn (OIDC)

ResponKu mendukung login menggunakan FunikIn (`auth.funikin.com`) berbasis **OAuth 2.1 / OpenID Connect (OIDC)** yang didukung oleh Supabase Auth OAuth Server.

#### Konfigurasi Environment (.env.local)

```env
# FunikIn OIDC Provider
FUNIKIN_ISSUER=https://<PROJECT_ID>.supabase.co/auth/v1
FUNIKIN_CLIENT_ID=responku-id
FUNIKIN_CLIENT_SECRET=your_client_secret_here
FUNIKIN_SCOPES=openid email profile

# Feature flag tombol login di halaman /masuk
NEXT_PUBLIC_ENABLE_FUNIKIN_LOGIN=false
```

- **Redirect URI**:
  - Development: `http://localhost:3000/auth/funikin/callback`
  - Production: `https://responku.id/auth/funikin/callback`
- **Identitas Pengguna**: ResponKu mengidentifikasi pengguna secara unik berdasarkan klaim `sub` (Subject Identifier) OIDC, bukan email. Profil tersimpan di koleksi MongoDB `oauth_users`.
- **Account Linking**: Penautan otomatis ke akun lokal hanya dilakukan jika `email_verified === true` (boolean ketat) DAN email akun lokal tujuan juga telah terverifikasi.
- **Validasi Keamanan**: PKCE (S256), `state`, `nonce`, verifikasi signature `id_token` via JWKS remote (`jose`), penguncian algoritma ke asymmetric (`RS256`, `ES256`, menolak `none` dan `HS*`), serta sanitasi post-login redirect (same-origin relative path only).

#### Menjalankan Pengujian OIDC Lokal

Untuk memverifikasi seluruh alur OIDC, penanganan error, dan keamanan tanpa memerlukan koneksi ke provider produksi:

```bash
npm run test:oidc
```

#### Prosedur Rotasi Client Secret

Jika `FUNIKIN_CLIENT_SECRET` perlu dirotasi:
1. Dapatkan client secret baru dari pengelola FunikIn / Supabase OAuth Server.
2. Perbarui nilai `FUNIKIN_CLIENT_SECRET` pada environment server (`.env.local` atau panel deployment).
3. Lakukan restart / redeploy aplikasi ResponKu.
*(Catatan: Rotasi tanpa downtime memerlukan provider OAuth yang mendukung dua client secret aktif secara bersamaan).*

### Pemeriksaan indeks Google

Menu artikel terindeks menggunakan URL Inspection API dari Google Search Console. Aktifkan Search Console API di Google Cloud, tambahkan email akun layanan sebagai pengguna properti Search Console, lalu isi variabel berikut di `.env.local`:

```text
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=email-akun-layanan
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:responku.id
```

`GOOGLE_SEARCH_CONSOLE_PROPERTY` harus sama persis dengan properti di Search Console. Gunakan `sc-domain:responku.id` untuk properti domain atau URL-prefix seperti `https://www.responku.id/` untuk properti URL. Jangan commit private key. Menu hanya menampilkan artikel yang verdict URL Inspection-nya `PASS`.

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

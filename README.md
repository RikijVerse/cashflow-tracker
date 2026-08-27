# Cashflow Tracker

**Cashflow Tracker** adalah aplikasi pelacak keuangan pribadi untuk mencatat pemasukan & pengeluaran, mengelola dompet, anggaran, target tabungan, tagihan, dan analitik keuangan secara sederhana. Aplikasi ini berjalan sebagai **Progressive Web App (PWA)** — bisa di-install ke layar utama HP (Android & iOS) dan dibuka layaknya aplikasi native, meski basisnya tetap web app yang di-deploy ke Vercel.

## Fitur

- 📊 Dashboard ringkas dengan grafik pemasukan & pengeluaran
- 💰 Manajemen **dompet/wallet** dengan saldo otomatis
- 🏷️ Kategori pemasukan & pengeluaran
- 📈 **Analitik** (pie/area chart) untuk melihat tren keuangan
- 🎯 **Target tabungan (goals)** dan **anggaran (budgets)**
- 🧾 Manajemen **tagihan (bills)** berulang
- 🔐 Autentikasi aman via Supabase Auth
- 🌗 Tema terang/gelap dengan preferensi tersimpan
- 📱 **PWA**: install ke home screen, offline-ready, auto-update

## Tech Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (konfigurasi CSS-first di `src/index.css`)
- **Supabase** (PostgreSQL + Auth) via `@supabase/supabase-js`
- **Recharts** untuk visualisasi data
- **jsPDF** + **jspdf-autotable** untuk ekspor PDF
- **vite-plugin-pwa** untuk service worker & manifest

## Getting Started

```bash
npm install
cp .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

Script tersedia:

| Script | Deskripsi |
| --- | --- |
| `npm run dev` | Jalankan dev server (PWA SW aktif di dev) |
| `npm run build` | Typecheck (`tsc`) + build produksi + generate PWA |
| `npm run preview` | Preview hasil build secara lokal |
| `npm run lint` | Lint dengan Oxlint |
| `npm run gen:pwa-icons` | Generate ulang PNG icon PWA dari `public/favicon.svg` |

## PWA — Cara Kerja

Konfigurasi PWA berada di `vite.config.ts` menggunakan **`vite-plugin-pwa`** (mode `generateSW`):

- **Manifest** (`manifest.webmanifest`) digenerate otomatis saat build dengan `name`, `short_name`, `description`, `display: standalone`, `start_url: /`, `orientation: portrait`, serta `theme_color` & `background_color` `#09090b` (sesuai tema gelap aplikasi).
- **Service worker** (`sw.js`) pakai `registerType: 'autoUpdate'` — update otomatis diterapkan tanpa uninstall/reinstall. Asset statis (JS, CSS, font, icon) di-precache agar load lebih cepat; font Google di-cache via runtime caching (`StaleWhileRevalidate`).
- **Offline fallback**: app shell di-precache sehingga UI tetap tampil saat offline, ditambah banner "Tidak ada koneksi internet" (`src/components/OfflineBanner.tsx` + `src/hooks/useOnlineStatus.ts`) dan halaman `public/offline.html` sebagai cadangan.

### Icons

Icon PWA (192×192, 512×512, versi **maskable**, dan `apple-touch-icon` 180×180) digenerate dari `public/favicon.svg` (vektor) lewat `scripts/gen-pwa-icons.mjs` (menggunakan `@resvg/resvg-js`). Source maskable ada di `public/pwa-maskable.svg`. Jalankan `npm run gen:pwa-icons` bila ingin regenerate.

### Install ke Home Screen

- **Android / Chrome**: buka situs → menu ⋮ → **"Install app"** / **"Add to Home Screen"**.
- **iOS / Safari**: buka situs → tap ikon bagikan → **"Add to Home Screen"**. Pastikan meta tag `apple-mobile-web-app-capable` & `apple-touch-icon` sudah terpasang (sudah ada di `index.html`).

## Deployment (Vercel)

Push ke branch `main` otomatis men-trigger deploy Vercel. `vercel.json` hanya berisi SPA rewrite (`/(.*) → /index.html`) yang tidak bentrok dengan service worker. Tidak ada header cache khusus yang dibutuhkan.

## Environment Variables

| Var | Deskripsi |
| --- | --- |
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key Supabase (aman di sisi klien) |

> ⚠️ Jangan pernah menyimpan `service_role` key di kode klien.

# 🤖 AI Coding Agent Guidelines

Dokumen ini berisi standar kerja & aturan wajib bagi AI Agent di repository ini.

---

## 1. Project Context & Environment
- **Environment:** Next-level SPA (Vite + React 19 + TypeScript + Tailwind CSS v4), di-deploy ke **Vercel**.
- **Backend & Database:** **Supabase** (PostgreSQL + Auth + Storage) — akses lewat Supabase JS client.
- **Stack Utama:** React, TypeScript, Tailwind CSS v4, Recharts, React Router, @supabase/supabase-js.
- Gunakan environment variables (`.env`) untuk data sensitif. Jangan pernah simpan kredensial/API keys langsung di dalam kode.
- Kunci `service_role` Supabase **dilarang** masuk ke kode klien/repo — hanya `anon/publishable` key yang boleh di env klien.

---

## 2. Code Quality & Security
- Tulis kode yang modular, mudah dibaca, dan aman dari kerentanan umum (SQL Injection & XSS).
- Semua query ke tabel user harus difilter `user_id` / mengandalkan **Row Level Security (RLS)** Supabase.
- Sebelum menyelesaikan tugas, pastikan kode telah divalidasi dan bebas dari kesalahan:
  `npm run lint` (oxlint) dan `npm run build` (typecheck + vite build).

---

## 3. Git Workflow & Deploy Trigger (WAJIB)
1. **Granular Commit:** Lakukan `git commit` untuk setiap 1 tugas/fitur kecil yang selesai dikerjakan. Gunakan format konvensi pesan commit (contoh: `feat: ...`, `fix: ...`, `refactor: ...`).
2. **Auto Push:** Setelah komit berhasil dan dipastikan bebas error, kamu **WAJIB** menjalankan perintah:
   `git push origin main`

   > ⚠️ **Catatan Penting:** Push ke branch `main` adalah pemicu (*trigger*) auto-deploy **Vercel** sehingga perubahan langsung ter-deploy ke production.

---

## 4. Restrictions (Yang Dilarang)
- ❌ Dilarang melakukan `git push` jika kodingan masih bermasalah/error (lint/build gagal).
- ❌ Dilarang menjalankan perintah terminal berskala destruktif (`rm -rf /`, `DROP DATABASE`, dll) tanpa persetujuan.
- ❌ Dilarang mengubah struktur folder utama aplikasi tanpa instruksi spesifik.
- ❌ Dilarang mengubah/menghapus data production langsung dari server tanpa persetujuan; perubahan schema/data dilakukan lewat file SQL migration yang dijalankan di Supabase SQL Editor.

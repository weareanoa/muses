# Admin Jadwal (Scheduler) MUSES

Halaman admin: **`/admin/schedules`**

Halaman ini mengelola tabel `public.schedules` (jadwal tur/show) di Supabase.
Halaman publik `/schedule` tetap bisa dibaca siapa saja.

## Yang sudah dibuat

- `supabase/migrations/20261031140200_muses_admin_schedules.sql` — migrasi admin.
- `supabase/schema.sql` — sudah ikut diperbarui dengan isi migrasi yang sama,
  jadi project Supabase baru yang hanya menjalankan `schema.sql` sudah
  langsung punya admin. Project lama cukup menjalankan file migrasi.
- `src/components/islands/AdminScheduleIsland.tsx` — UI list + tambah/edit/hapus.
- `src/pages/admin/schedules.astro` — halaman admin (server-rendered, tidak di-prerender).
- `src/services/authService.ts` — `getSupabaseAdminProfile()` untuk gate admin.
- `src/services/scheduleService.ts` — tambah `deleteSchedule()`, dan
  `upsertSchedule()` sekarang gagal eksplisit kalau Supabase belum
  dikonfigurasi (dulu mengembalikan `success: true` padahal tidak tersimpan).
- `src/types/database.ts` — `UserProfileDTO.role: 'user' | 'admin'`.

## Cara aktivasi (urutan ini penting)

### 1. Punya project Supabase dan terapkan schema

Di project Supabase yang dipakai muses, jalankan di SQL Editor, berurutan:

1. `supabase/schema.sql` (kalau project sudah pernah menjalankannya, lewati
   langkah ini dan langsung ke nomor 2).
2. `supabase/migrations/20261031140200_muses_admin_schedules.sql`.

### 1b. Jalur CLI (alternatif dari SQL Editor, untuk project BARU)

`supabase/migrations/` sekarang sudah berformat timestamp CLI:

- `20261031130000_muses_init.sql` — schema dasar (isi = `schema.sql` baris 1-159).
- `20261031140200_muses_admin_schedules.sql` — migrasi admin, isinya identik
  dengan file migrasi lama (sudah diverifikasi dengan `diff`).

Dari `~/muses`, berurutan:

```bash
supabase login
supabase init
supabase link --project-ref hpvhtjkoanamajtrtjgq
supabase db push
```

Catatan penting:

- `init` hanya membuat `config.toml`, dan `link` hanya menghubungkan folder
  ke project. Yang membuat tabel adalah `db push` di akhir.
- Jalankan `db push` hanya kalau project masih kosong. Kalau `schema.sql`
  sudah pernah diterapkan lewat SQL Editor, jangan `db push` lagi:
  migrasi dasar memakai `create policy` tanpa `if exists`, jadi push ulang
  akan gagal di policy yang sudah ada. Dalam kasus itu cukup `link` saja
  untuk migrasi-migrasi berikutnya.
- Ke depan, perubahan schema baru dibuat lewat `supabase migration new <nama>`
  (jangan edit migrasi lama, dan jangan hanya edit `schema.sql`).

### 2. Set environment di Cloudflare

Set sebagai **build variable** (bukan secret runtime, karena `PUBLIC_*`
di-inline saat build):

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Tanpa ini, halaman admin akan menampilkan "Supabase belum dikonfigurasi"
dan sengaja tidak mengedit `src/data/schedules.json`.

### 3. Daftarkan akun admin, lalu angkat role-nya

1. Daftarkan / login akun tersebut sekali lewat halaman `/register` atau
   `/login` supaya barisnya ada di `public.profiles` dan di `auth.users`.
2. Angkat role-nya menjadi `admin`. PENTING: `UPDATE` lewat Supabase SQL
   Editor TIDAK bisa dipakai untuk promosi ini — sesi SQL Editor tidak
   membawa JWT admin, jadi trigger `prevent_role_self_promotion` tetap
   menolaknya (pesan "Hanya admin yang dapat mengubah role."). Cara yang
   didukung:
   - PATCH lewat REST API dengan **service_role key** (server-side saja,
     jangan pernah ditaruh di kode browser atau di-commit):
     `PATCH /rest/v1/profiles?email=eq.<email-admin>` dengan header
     `apikey` + `Authorization: Bearer <service_role key>` dan body
     `{"role": "admin"}`; atau
   - admin yang sudah ada mengubah role akun tersebut.
   Sejak migrasi `20261031180000`, perubahan role oleh service_role key
   memang diizinkan trigger; user login biasa yang bukan admin tetap ditolak.

3. Login dengan akun itu lewat halaman login admin `/admin/login`, lalu
   buka `/admin/schedules`.

> Jangan pernah membuat tombol/form "jadikan saya admin" di aplikasi.
> Itu akan membatalkan seluruh perlindungan di bawah.

## Kenapa desainnya seperti ini

- **Gate UI bukan keamanan utama.** `AdminScheduleIsland` mengecek sesi
  Supabase + `profiles.role` lewat `getSupabaseAdminProfile()`. Fungsi itu
  sengaja tidak memakai `getSessionUser()` dan tidak memakai user demo
  lokal dari `localStorage`, karena keduanya bisa dipalsukan dari DevTools.
- **Penegakan ada di RLS.** Policy di migrasi:
  - publik: hanya `select` pada `schedules`,
  - admin: `insert` / `update` / `delete` pada `schedules`,
  - admin: `all` pada `profiles` (untuk keperluan verifikasi).
- **Anti self-promotion.** Ada trigger `prevent_role_self_promotion` di
  `profiles`: user biasa yang mencoba mengubah `role`-nya sendiri akan
  ditolak database dengan pesan "Hanya admin yang dapat mengubah role.",
  meskipun policy "update own profile" yang lama masih ada. Hanya admin
  yang sudah login, atau perubahan dengan service_role key (server-side
  saja), yang boleh mengubah role. UPDATE lewat SQL Editor tidak
  berlaku untuk promosi pertama karena sesinya tanpa JWT admin.
- **Helper `public.is_admin()`** dibuat `SECURITY DEFINER` supaya policy
  schedules yang memanggilnya tidak menimbulkan rekursi RLS saat membaca
  tabel `profiles`.

## Batasan v1 (sengaja)

- **Poster masih berupa URL/path teks**, belum upload file ke Storage.
  Admin bisa memasukkan `/images/…` (aset yang sudah ada di repo) atau
  URL gambar eksternal. Upload ke Supabase Storage + policy bucket-nya
  adalah pekerjaan lanjutan, bukan bagian v1 ini.
- **Tidak ada halaman admin untuk store** (produk/transaksi). Pola yang
  sama bisa dipakai ulang nanti: tambah policy admin untuk `products`,
  lalu halaman `/admin/products` yang memakai service yang sudah ada
  (`upsertProduct` / `deleteProduct`).
- **Tidak ada audit log** siapa mengubah jadwal apa dan kapan, selain
  `updated_at` di tabel. Kalau butuh jejak audit, tambahkan kolom
  `updated_by` + trigger, atau tabel audit terpisah.
- **Halaman publik masih fallback ke JSON** kalau tabel `schedules` di
  Supabase kosong. Begitu jadwal pertama disimpan dari admin, halaman
  publik akan memakai data Supabase.

## Cara menguji

1. Akun non-admin membuka `/admin/schedules` → harus melihat pesan
   "Akun ini bukan admin", dan tombol tambah/edit/hapus tidak muncul.
2. Akun admin menambah jadwal → jadwal muncul di `/schedule` (setelah
   rebuild/deploy, atau langsung kalau halaman publik membaca Supabase).
3. Akun non-admin mencoba `upsert`/`delete` lewat console Supabase JS
   dengan anon key → harus ditolak RLS (bukan sekadar disembunyikan UI).
4. Akun biasa mencoba `update profiles set role='admin'` → harus gagal
   karena trigger di atas.

## Rollback

Kalau admin mau dimatikan sementara tanpa menghapus data jadwal:

```sql
drop policy if exists "Admins can insert schedules" on public.schedules;
drop policy if exists "Admins can update schedules" on public.schedules;
drop policy if exists "Admins can delete schedules" on public.schedules;
drop policy if exists "Admins can manage profiles" on public.profiles;
```

Kolom `role` dan trigger bisa dibiarkan (tidak mengganggu bacaan publik),
atau dihapus dengan `drop trigger` + `drop function` + `alter table ...
drop column role` kalau benar-benar mau bersih.

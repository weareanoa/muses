-- Admin untuk scheduler (jadwal tur) MUSES
-- Jalankan file ini SETELAH supabase/schema.sql, di Supabase SQL Editor
-- (SQL Editor berjalan sebagai postgres dan melewati RLS, jadi bisa
-- dipakai untuk mengangkat admin pertama).
--
-- Ringkasnya:
-- 1. profiles.role ('user' | 'admin'), default 'user'.
-- 2. public.is_admin() (SECURITY DEFINER) supaya cek role tidak
--    menimbulkan rekursi RLS saat dipakai di policy schedules.
-- 3. Trigger yang melarang user mengubah role-nya sendiri.
--    Hanya admin (atau SQL Editor) yang boleh mengubah role.
-- 4. Policy schedules: publik hanya select, admin boleh insert/update/delete.
-- 5. Policy profiles untuk admin, supaya admin bisa membaca/mengelola
--    profil saat diperlukan (misalnya verifikasi akun).
-- 6. schedules.updated_at + index target_date.
--
-- File ini idempotent untuk kolom/index/trigger/policy yang dibuatnya:
-- boleh dijalankan ulang. Perintah DROP POLICY ... IF EXISTS hanya
-- menyentuh policy baru di bawah, bukan policy lama di schema.sql.

-- 1. Kolom role -------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

-- 2. Helper is_admin ---------------------------------------------------
-- SECURITY DEFINER + search_path tetap penting: fungsi ini membaca
-- profiles tanpa terkena RLS, jadi policy schedules yang memanggilnya
-- tidak akan berputar (rekursi) saat mengecek role.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- 3. Larang self-promotion --------------------------------------------
-- Tanpa trigger ini, policy "update own profile" di schema.sql bisa
-- dipakai user untuk mengubah role-nya sendiri menjadi admin, karena
-- policy lama memakai FOR ALL dengan USING (auth.uid() = id).
-- Trigger ini menutup celah itu di level database, bukan hanya di UI.
create or replace function public.prevent_role_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengubah role.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_self_promotion on public.profiles;
create trigger prevent_role_self_promotion
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_promotion();

-- 4. Schedules: kolom + index ------------------------------------------
alter table public.schedules
  add column if not exists updated_at timestamptz default now();

create index if not exists schedules_target_date_idx
  on public.schedules (target_date);

-- 5. Policy admin untuk profiles ---------------------------------------
drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Policy admin untuk schedules --------------------------------------
-- Policy select publik yang lama ("Public schedules are viewable by
-- everyone") tetap dipertahankan, jadi pengunjung tetap bisa melihat
-- jadwal. Yang ditambahkan di sini hanya jalur tulis untuk admin.
drop policy if exists "Admins can insert schedules" on public.schedules;
create policy "Admins can insert schedules"
  on public.schedules for insert
  with check (public.is_admin());

drop policy if exists "Admins can update schedules" on public.schedules;
create policy "Admins can update schedules"
  on public.schedules for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete schedules" on public.schedules;
create policy "Admins can delete schedules"
  on public.schedules for delete
  using (public.is_admin());

-- 7. Mengangkat admin pertama (JALANKAN MANUAL, JANGAN DI-AUTOMATE) --
-- Ganti email di bawah dengan email akun Supabase Auth yang sudah
-- terdaftar dan sudah punya baris di public.profiles, lalu jalankan
-- perintah ini sekali di Supabase SQL Editor:
--
--   update public.profiles set role = 'admin' where email = 'admin@muses.id';
--
-- Jangan pernah menambahkan endpoint / form "jadikan saya admin" di
-- aplikasi: itu akan membatalkan seluruh perlindungan di atas.

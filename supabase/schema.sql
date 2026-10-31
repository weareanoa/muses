create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  phone text,
  username text unique,
  auth_provider text default 'email',
  avatar text,
  bias text default 'Faril',
  bias_emoji text default '🦋',
  membership_tier text default 'Official MUSES CIRCLE',
  membership_number text unique,
  selected_address_id uuid,
  joined_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null default 'Rumah',
  recipient_name text not null,
  phone text not null,
  street text not null,
  district text,
  city text not null,
  province text not null,
  postal_code text not null,
  detail text,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.schedules (
  id text primary key,
  tour_name text not null,
  title text not null,
  day text not null,
  day_name text not null,
  month text not null,
  year text not null,
  city text not null,
  country text not null default 'INDONESIA',
  venue text not null,
  status text not null default 'Available',
  door_open text,
  show_time text not null,
  ticket_url text,
  poster_image text not null,
  target_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  tagline text,
  subtitle text,
  category text not null,
  catalog_type text not null default 'MERCHANDISE',
  price numeric not null default 0,
  currency text not null default 'IDR',
  rating numeric default 5.0,
  review_count integer default 0,
  color text,
  image text not null,
  gallery jsonb default '[]'::jsonb,
  description text,
  is_featured boolean default false,
  stock integer not null default 0,
  sku text unique,
  release_date text,
  manufacturer text,
  origin text,
  options jsonb default '[]'::jsonb,
  colors jsonb default '[]'::jsonb,
  sizes jsonb default '[]'::jsonb,
  details jsonb default '[]'::jsonb,
  features jsonb default '[]'::jsonb,
  package_contents jsonb default '[]'::jsonb,
  specifications jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id text primary key,
  order_code text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'unpaid',
  status_label text not null default 'Menunggu pembayaran',
  event_tag text default 'OFFICIAL STORE',
  delivery_info text,
  subtotal numeric not null default 0,
  shipping_fee numeric not null default 0,
  platform_fee numeric not null default 0,
  total_price numeric not null default 0,
  payment_method text default 'qris',
  notes text,
  action_type text not null default 'unpaid',
  pickup_location text,
  pickup_date text,
  pickup_code text,
  shipping_courier text,
  tracking_number text,
  estimated_arrival text,
  shipping_address jsonb,
  stepper jsonb default '[]'::jsonb,
  payment_deadline timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.transaction_items (
  id uuid default gen_random_uuid() primary key,
  transaction_id text references public.transactions(id) on delete cascade not null,
  product_id text,
  name text not null,
  variant text not null default 'Standard',
  image text not null,
  quantity integer not null default 1,
  price numeric not null default 0
);

alter table public.profiles enable row level security;
alter table public.user_addresses enable row level security;
alter table public.schedules enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

create policy "Public schedules are viewable by everyone"
  on public.schedules for select using (true);

create policy "Public products are viewable by everyone"
  on public.products for select using (true);

create policy "Users can view and update own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users can manage own addresses"
  on public.user_addresses for all using (auth.uid() = user_id);

create policy "Users can view and create own transactions"
  on public.transactions for all using (auth.uid() = user_id or user_id is null);

create policy "Users can view and create own transaction items"
  on public.transaction_items for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_items.transaction_id
      and (t.user_id = auth.uid() or t.user_id is null)
    )
  );


-- Admin scheduler (sama dengan supabase/migrations/20261031140200_muses_admin_schedules.sql).
-- Ditambahkan agar project Supabase baru yang hanya menjalankan schema.sql
-- ini sudah langsung punya role admin + RLS schedules. Project lama yang
-- sudah menjalankan schema.sql versi lama cukup menjalankan file migrasi.
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
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.role(), 'anon') <> 'service_role' then
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


-- Profil otomatis untuk user baru (sama dengan migrasi 20261031151000).
-- Profil otomatis untuk user baru Supabase Auth (email maupun Google).
--
-- Masalah yang diperbaiki: sebelumnya login Google hanya membuat user lokal
-- dummy, tanpa pernah menyelesaikan OAuth. Setelah OAuth diperbaiki, user
-- Google yang kembali dari Google punya sesi Supabase tapi belum punya
-- baris di public.profiles, sehingga getSessionUser() tidak bisa
-- mengembalikan profilnya. Trigger ini membuat baris profil minimal saat
-- auth.users dibuat, jadi profil selalu ada untuk sesi baru.
-- Untuk signup email, upsert profil di kode tetap berjalan setelahnya dan
-- mengisi detail (nama, phone, username, membership) di atas baris ini.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, name, auth_provider, bias, bias_emoji,
    membership_tier, membership_number
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    'Faril',
    '🦋',
    'Official MUSES CIRCLE',
    'MUSES-' || substr(new.id::text, 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

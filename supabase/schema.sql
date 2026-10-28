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
  id uuid default uuid_generate_v4() primary key,
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
  id uuid default uuid_generate_v4() primary key,
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


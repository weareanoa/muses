-- Pemesanan aman (2026-11-02).
--
-- Sebelumnya browser menulis langsung ke transactions memakai anon key dan
-- policy "FOR ALL ... OR user_id IS NULL", sehingga siapa pun bisa membuat
-- order dengan harga bebas, membaca order guest, atau menandai order lunas.
--
-- Mulai migrasi ini:
--   * User hanya bisa MEMBACA ordernya sendiri; admin bisa membaca semua.
--   * Semua penulisan order lewat fungsi SECURITY DEFINER di bawah, yang
--     menghitung harga/stok dari tabel products dan mengurangi stok atomik.
--   * Alur bayar manual: user klaim sudah bayar (awaiting_verification),
--     admin memverifikasi dengan referensi mutasi. Pintu yang sama
--     (_mark_paid) dipakai webhook DOKU nanti lewat gateway_mark_paid.
--   * Toggle gateway: app_settings.payment_gateway_enabled (default false).
--
-- Opsional: jadwalkan expire otomatis dengan pg_cron, mis.
--   select cron.schedule('expire-orders', '*/5 * * * *',
--     $$select public.expire_stale_orders()$$);
-- Tanpa pg_cron, order kedaluwarsa dibereskan saat ada checkout baru atau
-- saat user/admin membuka daftar pesanan.

-- 1. Kolom & constraint -------------------------------------------------
update public.transactions set status = 'processing' where status = 'paid';
update public.transactions
  set status = 'cancelled'
  where status not in ('unpaid', 'processing', 'completed', 'cancelled');

alter table public.transactions
  add column if not exists payment_mode text not null default 'manual',
  add column if not exists fulfillment_method text not null default 'delivery',
  add column if not exists unique_code integer not null default 0,
  add column if not exists payable_amount numeric,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists payment_reference text,
  add column if not exists reject_reason text,
  add column if not exists admin_note text,
  add column if not exists pickup_event_id text,
  add column if not exists pickup_contact_name text,
  add column if not exists pickup_contact_phone text;

-- Order lama tidak pernah mengurangi stok, jadi tidak boleh mengembalikannya.
alter table public.transactions
  add column if not exists stock_released boolean not null default true;
alter table public.transactions alter column stock_released set default false;

update public.transactions
  set fulfillment_method = 'pickup'
  where pickup_code is not null and fulfillment_method = 'delivery';
update public.transactions set payable_amount = total_price where payable_amount is null;

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions
  add constraint transactions_status_check check (
    status in (
      'unpaid', 'awaiting_verification', 'processing', 'ready',
      'completed', 'cancelled', 'rejected', 'expired'
    )
  );

alter table public.transactions drop constraint if exists transactions_payment_mode_check;
alter table public.transactions
  add constraint transactions_payment_mode_check check (payment_mode in ('manual', 'doku'));

alter table public.transactions drop constraint if exists transactions_fulfillment_method_check;
alter table public.transactions
  add constraint transactions_fulfillment_method_check
  check (fulfillment_method in ('delivery', 'pickup'));

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);
create index if not exists transactions_status_deadline_idx
  on public.transactions (status, payment_deadline);

-- Nominal unik per order terbuka: satu mutasi masuk = satu order.
create unique index if not exists transactions_open_payable_amount_idx
  on public.transactions (payable_amount)
  where status in ('unpaid', 'awaiting_verification') and unique_code > 0;

-- 2. Pengaturan ---------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

drop policy if exists "Settings are readable by everyone" on public.app_settings;
create policy "Settings are readable by everyone"
  on public.app_settings for select using (true);

drop policy if exists "Admins can manage settings" on public.app_settings;
create policy "Admins can manage settings"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.app_settings (key, value) values
  ('payment_gateway_enabled', 'false'::jsonb),
  ('payment_deadline_minutes', '60'::jsonb),
  ('max_open_unpaid_orders', '2'::jsonb),
  ('max_qty_per_item', '10'::jsonb),
  ('order_cooldown_threshold', '3'::jsonb),
  ('qris_image_url', '"/images/payment/qris.png"'::jsonb)
on conflict (key) do nothing;

create or replace function public._setting_text(p_key text, p_default text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = p_key), p_default)
$$;

-- 3. Audit log ----------------------------------------------------------
create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  transaction_id text not null references public.transactions(id) on delete cascade,
  actor_id uuid,
  actor_role text not null default 'system',
  event text not null,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_transaction_idx
  on public.order_events (transaction_id, created_at);

alter table public.order_events enable row level security;

drop policy if exists "Admins can view order events" on public.order_events;
create policy "Admins can view order events"
  on public.order_events for select using (public.is_admin());

-- 4. RLS transaksi: baca saja ------------------------------------------
drop policy if exists "Users can view and create own transactions" on public.transactions;
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all transactions" on public.transactions;
create policy "Admins can view all transactions"
  on public.transactions for select using (public.is_admin());

drop policy if exists "Users can view and create own transaction items" on public.transaction_items;
drop policy if exists "Users can view own transaction items" on public.transaction_items;
create policy "Users can view own transaction items"
  on public.transaction_items for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_items.transaction_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
  );

revoke insert, update, delete on public.transactions from anon, authenticated;
revoke insert, update, delete on public.transaction_items from anon, authenticated;
revoke insert, update, delete, truncate on public.order_events from anon, authenticated;

-- 5. Helper internal ----------------------------------------------------
create or replace function public._status_label(p_status text, p_method text)
returns text
language sql
immutable
as $$
  select case p_status
    when 'unpaid' then 'Menunggu pembayaran'
    when 'awaiting_verification' then 'Menunggu verifikasi'
    when 'processing' then 'Sedang diproses'
    when 'ready' then case when p_method = 'pickup' then 'Siap diambil' else 'Dikirim' end
    when 'completed' then 'Selesai'
    when 'cancelled' then 'Dibatalkan'
    when 'rejected' then 'Pembayaran ditolak'
    when 'expired' then 'Kedaluwarsa'
    else p_status
  end
$$;

create or replace function public._order_stepper(p_method text, p_status text)
returns jsonb
language sql
immutable
as $$
  with labels(idx, label) as (
    values
      (1, 'Pesanan Dibuat'),
      (2, 'Dibayar'),
      (3, 'Disiapkan Management'),
      (4, case when p_method = 'pickup' then 'Diambil di Event' else 'Dikirim' end),
      (5, 'Selesai')
  ),
  prog(n) as (
    select case p_status
      when 'processing' then 2
      when 'ready' then case when p_method = 'pickup' then 3 else 4 end
      when 'completed' then 5
      else 1
    end
  )
  select jsonb_agg(jsonb_build_object('label', l.label, 'completed', l.idx <= p.n) order by l.idx)
  from labels l, prog p
$$;

create or replace function public._log_event(
  p_id text, p_event text, p_from text, p_to text, p_note text, p_actor_role text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_events (transaction_id, actor_id, actor_role, event, from_status, to_status, note)
  values (
    p_id,
    auth.uid(),
    coalesce(
      p_actor_role,
      case
        when auth.uid() is null then 'system'
        when public.is_admin() then 'admin'
        else 'user'
      end
    ),
    p_event, p_from, p_to, p_note
  );
end;
$$;

create or replace function public._apply_status(
  p_id text, p_to text, p_note text default null, p_event text default null, p_actor_role text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from text;
  v_method text;
begin
  select status, fulfillment_method into v_from, v_method
  from public.transactions where id = p_id;

  update public.transactions
  set status = p_to,
      status_label = public._status_label(p_to, v_method),
      action_type = case
        when p_to in ('processing', 'ready') then case when v_method = 'pickup' then 'pickup' else 'shipping' end
        when p_to = 'completed' then 'completed'
        when p_to in ('unpaid', 'awaiting_verification') then 'unpaid'
        else 'none'
      end,
      stepper = public._order_stepper(v_method, p_to),
      updated_at = now()
  where id = p_id;

  perform public._log_event(p_id, coalesce(p_event, p_to), v_from, p_to, p_note, p_actor_role);
end;
$$;

create or replace function public._release_order_stock(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if (select stock_released from public.transactions where id = p_id) then
    return;
  end if;
  for r in
    select product_id, quantity from public.transaction_items
    where transaction_id = p_id and product_id is not null
  loop
    update public.products
    set stock = stock + r.quantity, updated_at = now()
    where id = r.product_id;
  end loop;
  update public.transactions set stock_released = true where id = p_id;
end;
$$;

create or replace function public._order_json(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (to_jsonb(t) - 'admin_note' - 'verified_by')
    || jsonb_build_object(
      'transaction_items',
      coalesce(
        (select jsonb_agg(to_jsonb(i) order by i.id)
         from public.transaction_items i where i.transaction_id = t.id),
        '[]'::jsonb
      )
    )
  from public.transactions t
  where t.id = p_id
$$;

create or replace function public._mark_paid(
  p_id text, p_source text, p_reference text, p_actor uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  select * into t from public.transactions where id = p_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status in ('processing', 'ready', 'completed') then
    return;
  end if;
  if t.status not in ('unpaid', 'awaiting_verification') then
    raise exception 'INVALID_STATE';
  end if;

  update public.transactions
  set paid_at = now(),
      verified_by = p_actor,
      verified_at = now(),
      payment_reference = p_reference,
      pickup_code = case
        when fulfillment_method = 'pickup' and pickup_code is null
          then 'PKP-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))
        else pickup_code
      end
  where id = p_id;

  perform public._apply_status(p_id, 'processing', 'Pembayaran diverifikasi (' || p_source || ')', 'paid');
end;
$$;

-- 6. Expire -------------------------------------------------------------
create or replace function public.expire_stale_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select id from public.transactions
    where status = 'unpaid'
      and payment_deadline is not null
      and payment_deadline < now()
    order by id
    for update skip locked
  loop
    perform public._release_order_stock(r.id);
    perform public._apply_status(r.id, 'expired', 'Melewati batas waktu pembayaran', 'expired', 'system');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- 7. Aksi pembeli -------------------------------------------------------
create or replace function public.create_order(
  p_items jsonb,
  p_fulfillment jsonb,
  p_address jsonb default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_method text := coalesce(p_fulfillment ->> 'method', 'delivery');
  v_max_open integer := public._setting_text('max_open_unpaid_orders', '2')::integer;
  v_max_qty integer := public._setting_text('max_qty_per_item', '10')::integer;
  v_cooldown integer := public._setting_text('order_cooldown_threshold', '3')::integer;
  v_minutes integer := public._setting_text('payment_deadline_minutes', '60')::integer;
  v_gateway boolean := public._setting_text('payment_gateway_enabled', 'false') = 'true';
  v_expected integer;
  v_found integer := 0;
  v_subtotal numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_row record;
  v_line record;
  v_event public.schedules%rowtype;
  v_name text;
  v_phone text;
  v_addr jsonb;
  v_delivery_info text;
  v_event_tag text;
  v_pickup_date text;
  v_pickup_location text;
  v_code integer;
  v_payable numeric;
  v_attempt integer := 0;
  v_number text;
  v_id text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if v_method not in ('delivery', 'pickup') then
    raise exception 'INVALID_FULFILLMENT';
  end if;
  if v_gateway then
    raise exception 'GATEWAY_NOT_READY';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 30 then
    raise exception 'INVALID_ITEMS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where coalesce(e ->> 'id', '') = ''
       or case when coalesce(e ->> 'quantity', '') ~ '^[0-9]{1,3}$'
                then (e ->> 'quantity')::integer else 0 end < 1
  ) then
    raise exception 'INVALID_ITEMS';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  perform public.expire_stale_orders();

  if (
    select count(*) from public.transactions
    where user_id = v_uid and status in ('unpaid', 'awaiting_verification')
  ) >= v_max_open then
    raise exception 'TOO_MANY_OPEN_ORDERS';
  end if;

  if (
    select count(*) from public.transactions
    where user_id = v_uid
      and created_at > now() - interval '30 days'
      and (status in ('rejected', 'expired') or (status = 'cancelled' and paid_at is null))
  ) >= v_cooldown then
    raise exception 'ORDER_COOLDOWN';
  end if;

  select count(distinct e ->> 'id') into v_expected from jsonb_array_elements(p_items) e;

  for v_row in
    select p.id, p.name, p.subtitle, p.image, p.price, p.stock, p.currency, a.qty
    from (
      select e ->> 'id' as id, sum((e ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) e
      group by 1
    ) a
    join public.products p on p.id = a.id
    order by p.id
    for update of p
  loop
    v_found := v_found + 1;
    if v_row.currency <> 'IDR' or v_row.price <= 0 then
      raise exception 'UNKNOWN_PRODUCT';
    end if;
    if v_row.qty > v_max_qty then
      raise exception 'QTY_LIMIT';
    end if;
    if v_row.qty > v_row.stock then
      raise exception 'STOCK_INSUFFICIENT';
    end if;
    v_subtotal := v_subtotal + v_row.price * v_row.qty;
    v_lines := v_lines || jsonb_build_object(
      'id', v_row.id,
      'name', v_row.name,
      'variant', coalesce(nullif(v_row.subtitle, ''), 'Official Merchandise'),
      'image', v_row.image,
      'price', v_row.price,
      'qty', v_row.qty
    );
  end loop;

  if v_found <> v_expected then
    raise exception 'UNKNOWN_PRODUCT';
  end if;

  if v_method = 'pickup' then
    select * into v_event from public.schedules where id = p_fulfillment ->> 'pickupEventId';
    if not found then
      raise exception 'INVALID_EVENT';
    end if;
    if v_event.target_date is not null and v_event.target_date < now() then
      raise exception 'EVENT_PASSED';
    end if;
    v_name := left(btrim(coalesce(p_fulfillment ->> 'pickupContactName', '')), 80);
    v_phone := regexp_replace(coalesce(p_fulfillment ->> 'pickupContactPhone', ''), '[\s\-\.\(\)]', '', 'g');
    v_pickup_location := concat_ws(', ', nullif(v_event.venue, ''), nullif(v_event.city, ''));
    v_pickup_date := concat_ws(' ', nullif(v_event.day_name, ''), v_event.day, v_event.month, v_event.year);
    v_delivery_info := btrim(concat_ws(' • ', nullif(v_event.tour_name, ''), nullif(v_pickup_location, '')));
    v_event_tag := coalesce(nullif(v_event.tour_name, ''), 'OFFICIAL STORE • MERCH');
    v_addr := null;
  else
    if p_address is null
       or jsonb_typeof(p_address) is distinct from 'object'
       or coalesce(btrim(p_address ->> 'recipientName'), '') = ''
       or coalesce(btrim(p_address ->> 'street'), '') = ''
       or coalesce(btrim(p_address ->> 'city'), '') = ''
       or coalesce(btrim(p_address ->> 'province'), '') = ''
       or coalesce(btrim(p_address ->> 'postalCode'), '') = '' then
      raise exception 'INVALID_ADDRESS';
    end if;
    v_name := left(btrim(p_address ->> 'recipientName'), 80);
    v_phone := regexp_replace(coalesce(p_address ->> 'phone', ''), '[\s\-\.\(\)]', '', 'g');
    v_addr := jsonb_build_object(
      'label', left(coalesce(p_address ->> 'label', 'Rumah'), 30),
      'recipientName', v_name,
      'phone', v_phone,
      'street', left(btrim(p_address ->> 'street'), 200),
      'district', left(coalesce(p_address ->> 'district', ''), 100),
      'city', left(btrim(p_address ->> 'city'), 100),
      'province', left(btrim(p_address ->> 'province'), 100),
      'postalCode', left(btrim(p_address ->> 'postalCode'), 10),
      'detail', left(coalesce(p_address ->> 'detail', ''), 200)
    );
    v_delivery_info := left(btrim(p_address ->> 'city'), 100);
    v_event_tag := 'OFFICIAL STORE • MERCH';
  end if;

  if length(v_name) < 2 or v_phone !~ '^\+?[0-9]{9,15}$' then
    raise exception 'INVALID_CONTACT';
  end if;

  -- Kode unik ditiadakan, pembayaran pas sesuai subtotal (misal pas 40k)
  v_code := 0;
  v_payable := v_subtotal;

  v_number := 'INV-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_id := 'MSE-' || v_number;

  insert into public.transactions (
    id, order_code, user_id, status, status_label, event_tag, delivery_info,
    subtotal, shipping_fee, platform_fee, total_price, payment_method, payment_mode,
    notes, action_type, fulfillment_method, pickup_location, pickup_date,
    pickup_event_id, pickup_contact_name, pickup_contact_phone, shipping_address,
    stepper, unique_code, payable_amount, payment_deadline
  ) values (
    v_id, v_id, v_uid, 'unpaid', public._status_label('unpaid', v_method), v_event_tag, v_delivery_info,
    v_subtotal, 0, 0, v_subtotal, 'qris', 'manual',
    left(coalesce(p_notes, ''), 500), 'unpaid', v_method,
    case when v_method = 'pickup' then v_pickup_location end,
    case when v_method = 'pickup' then v_pickup_date end,
    case when v_method = 'pickup' then v_event.id end,
    case when v_method = 'pickup' then v_name end,
    case when v_method = 'pickup' then v_phone end,
    v_addr,
    public._order_stepper(v_method, 'unpaid'), v_code, v_payable,
    now() + make_interval(mins => v_minutes)
  );

  for v_line in
    select * from jsonb_to_recordset(v_lines)
      as x(id text, name text, variant text, image text, price numeric, qty integer)
  loop
    insert into public.transaction_items (transaction_id, product_id, name, variant, image, quantity, price)
    values (v_id, v_line.id, v_line.name, v_line.variant, v_line.image, v_line.qty, v_line.price);

    update public.products
    set stock = stock - v_line.qty, updated_at = now()
    where id = v_line.id;
  end loop;

  perform public._log_event(v_id, 'created', null, 'unpaid', null);

  return public._order_json(v_id);
end;
$$;

create or replace function public.claim_payment(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into t from public.transactions
  where id = p_order_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if t.status = 'awaiting_verification' then
    return public._order_json(t.id);
  end if;
  if t.status = 'expired' or (t.status = 'unpaid' and t.payment_deadline < now()) then
    raise exception 'ORDER_EXPIRED';
  end if;
  if t.status <> 'unpaid' then
    raise exception 'INVALID_STATE';
  end if;

  update public.transactions
  set proof_submitted_at = now(), reject_reason = null
  where id = t.id;
  perform public._apply_status(t.id, 'awaiting_verification', 'Pembeli menyatakan sudah membayar', 'claimed');

  return public._order_json(t.id);
end;
$$;

create or replace function public.cancel_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into t from public.transactions
  where id = p_order_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status <> 'unpaid' then
    raise exception 'INVALID_STATE';
  end if;

  perform public._release_order_stock(t.id);
  perform public._apply_status(t.id, 'cancelled', 'Dibatalkan pembeli');

  return public._order_json(t.id);
end;
$$;

-- 8. Aksi admin ---------------------------------------------------------
create or replace function public.admin_verify_payment(p_order_id text, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if length(btrim(coalesce(p_reference, ''))) < 3 then
    raise exception 'REFERENCE_REQUIRED';
  end if;

  perform public._mark_paid(p_order_id, 'manual_admin', btrim(p_reference), auth.uid());
  return public._order_json(p_order_id);
end;
$$;

create or replace function public.admin_reject_payment(
  p_order_id text, p_reason text, p_allow_retry boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into t from public.transactions where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status not in ('unpaid', 'awaiting_verification') then
    raise exception 'INVALID_STATE';
  end if;

  update public.transactions
  set reject_reason = btrim(p_reason), proof_submitted_at = null
  where id = t.id;

  if p_allow_retry and t.payment_deadline > now() then
    perform public._apply_status(t.id, 'unpaid', btrim(p_reason), 'rejected_retry');
  else
    perform public._release_order_stock(t.id);
    perform public._apply_status(t.id, 'rejected', btrim(p_reason), 'rejected');
  end if;

  return public._order_json(t.id);
end;
$$;

create or replace function public.admin_advance_order(
  p_order_id text,
  p_to text,
  p_note text default null,
  p_tracking text default null,
  p_pickup_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into t from public.transactions where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if not ((t.status = 'processing' and p_to = 'ready') or (t.status = 'ready' and p_to = 'completed')) then
    raise exception 'INVALID_TRANSITION';
  end if;

  if p_to = 'completed'
     and t.fulfillment_method = 'pickup'
     and upper(btrim(coalesce(p_pickup_code, ''))) is distinct from t.pickup_code then
    raise exception 'PICKUP_CODE_MISMATCH';
  end if;

  if nullif(btrim(coalesce(p_tracking, '')), '') is not null then
    update public.transactions set tracking_number = btrim(p_tracking) where id = t.id;
  end if;
  if nullif(btrim(coalesce(p_note, '')), '') is not null then
    update public.transactions set admin_note = btrim(p_note) where id = t.id;
  end if;

  perform public._apply_status(t.id, p_to, p_note);
  return public._order_json(t.id);
end;
$$;

create or replace function public.admin_cancel_order(p_order_id text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into t from public.transactions where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status not in ('processing', 'ready') then
    raise exception 'INVALID_STATE';
  end if;

  update public.transactions set admin_note = btrim(p_reason) where id = t.id;
  perform public._release_order_stock(t.id);
  perform public._apply_status(t.id, 'cancelled', btrim(p_reason), 'cancelled_by_admin');

  return public._order_json(t.id);
end;
$$;

-- Buka kembali order kedaluwarsa yang ternyata sudah dibayar (stok dipesan ulang).
create or replace function public.admin_reopen_order(p_order_id text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
  v_item record;
  v_minutes integer := public._setting_text('payment_deadline_minutes', '60')::integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  select * into t from public.transactions where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status <> 'expired' then
    raise exception 'INVALID_STATE';
  end if;
  if exists (
    select 1 from public.transactions o
    where o.payable_amount = t.payable_amount
      and o.id <> t.id
      and o.unique_code > 0
      and o.status in ('unpaid', 'awaiting_verification')
  ) then
    raise exception 'AMOUNT_CONFLICT';
  end if;

  for v_item in
    select i.product_id, i.quantity, p.stock
    from public.transaction_items i
    join public.products p on p.id = i.product_id
    where i.transaction_id = t.id
    order by p.id
    for update of p
  loop
    if v_item.quantity > v_item.stock then
      raise exception 'STOCK_INSUFFICIENT';
    end if;
    update public.products
    set stock = stock - v_item.quantity, updated_at = now()
    where id = v_item.product_id;
  end loop;

  update public.transactions
  set stock_released = false,
      payment_deadline = now() + make_interval(mins => v_minutes),
      admin_note = btrim(p_reason)
  where id = t.id;
  perform public._apply_status(t.id, 'awaiting_verification', btrim(p_reason), 'reopened');

  return public._order_json(t.id);
end;
$$;

-- Pintu masuk webhook DOKU (dipanggil dengan service_role dari endpoint server).
create or replace function public.gateway_mark_paid(p_order_id text, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'FORBIDDEN';
  end if;
  perform public._mark_paid(p_order_id, 'doku', p_reference, null);
  return public._order_json(p_order_id);
end;
$$;

-- 9. Hak eksekusi -------------------------------------------------------
revoke all on function public._setting_text(text, text) from public, anon, authenticated;
revoke all on function public._status_label(text, text) from public, anon, authenticated;
revoke all on function public._order_stepper(text, text) from public, anon, authenticated;
revoke all on function public._log_event(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public._apply_status(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public._release_order_stock(text) from public, anon, authenticated;
revoke all on function public._order_json(text) from public, anon, authenticated;
revoke all on function public._mark_paid(text, text, text, uuid) from public, anon, authenticated;

revoke all on function public.expire_stale_orders() from public, anon;
revoke all on function public.create_order(jsonb, jsonb, jsonb, text) from public, anon;
revoke all on function public.claim_payment(text) from public, anon;
revoke all on function public.cancel_order(text) from public, anon;
revoke all on function public.admin_verify_payment(text, text) from public, anon;
revoke all on function public.admin_reject_payment(text, text, boolean) from public, anon;
revoke all on function public.admin_advance_order(text, text, text, text, text) from public, anon;
revoke all on function public.admin_cancel_order(text, text) from public, anon;
revoke all on function public.admin_reopen_order(text, text) from public, anon;
revoke all on function public.gateway_mark_paid(text, text) from public, anon, authenticated;

grant execute on function public.expire_stale_orders() to authenticated;
grant execute on function public.create_order(jsonb, jsonb, jsonb, text) to authenticated;
grant execute on function public.claim_payment(text) to authenticated;
grant execute on function public.cancel_order(text) to authenticated;
grant execute on function public.admin_verify_payment(text, text) to authenticated;
grant execute on function public.admin_reject_payment(text, text, boolean) to authenticated;
grant execute on function public.admin_advance_order(text, text, text, text, text) to authenticated;
grant execute on function public.admin_cancel_order(text, text) to authenticated;
grant execute on function public.admin_reopen_order(text, text) to authenticated;
grant execute on function public.gateway_mark_paid(text, text) to service_role;

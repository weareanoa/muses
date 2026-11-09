-- Migrasi: Menghilangkan kode unik pembayaran QRIS (nominal pas sesuai subtotal)
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

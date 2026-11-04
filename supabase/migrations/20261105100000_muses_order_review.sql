create table if not exists public.order_reviews (
  order_id text primary key references public.transactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.order_reviews enable row level security;

drop policy if exists "Users can view own reviews" on public.order_reviews;
create policy "Users can view own reviews"
  on public.order_reviews for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all reviews" on public.order_reviews;
create policy "Admins can view all reviews"
  on public.order_reviews for select using (public.is_admin());

revoke insert, update, delete, truncate on public.order_reviews from anon, authenticated;

create or replace function public._refresh_product_ratings(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set rating = round(s.avg_rating, 1),
      review_count = s.cnt
  from (
    select x.product_id, avg(x.rating)::numeric as avg_rating, count(*)::integer as cnt
    from (
      select distinct i.product_id, r.order_id, r.rating
      from public.order_reviews r
      join public.transaction_items i on i.transaction_id = r.order_id
      where i.product_id in (
        select product_id from public.transaction_items
        where transaction_id = p_order_id and product_id is not null
      )
    ) x
    group by x.product_id
  ) s
  where p.id = s.product_id;
end;
$$;

create or replace function public.user_confirm_received(p_order_id text)
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
  if t.status <> 'ready' or t.fulfillment_method <> 'delivery' then
    raise exception 'INVALID_STATE';
  end if;

  perform public._apply_status(t.id, 'completed', 'Diterima pembeli', 'received');
  return public._order_json(t.id);
end;
$$;

create or replace function public.submit_order_review(
  p_order_id text,
  p_rating integer,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING';
  end if;

  select * into t from public.transactions
  where id = p_order_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if t.status <> 'completed' then
    raise exception 'INVALID_STATE';
  end if;
  if exists (select 1 from public.order_reviews where order_id = t.id) then
    raise exception 'ALREADY_REVIEWED';
  end if;

  insert into public.order_reviews (order_id, user_id, rating, comment)
  values (t.id, auth.uid(), p_rating, left(v_comment, 500));

  perform public._refresh_product_ratings(t.id);
  perform public._log_event(t.id, 'reviewed', t.status, t.status, p_rating::text || '/5');

  return jsonb_build_object('order_id', t.id, 'rating', p_rating, 'comment', left(v_comment, 500));
end;
$$;

revoke execute on function public.user_confirm_received(text) from public, anon;
revoke execute on function public.submit_order_review(text, integer, text) from public, anon;
revoke execute on function public._refresh_product_ratings(text) from public, anon, authenticated;
grant execute on function public.user_confirm_received(text) to authenticated;
grant execute on function public.submit_order_review(text, integer, text) to authenticated;

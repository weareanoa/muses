-- Pengaturan admin (2026-11-02).
--
-- app_settings sebelumnya bisa ditulis admin langsung dengan key/nilai
-- bebas. Sekarang penulisan hanya lewat admin_update_settings, yang
-- membatasi key yang dikenal dan rentang nilainya. Bucket payment-assets
-- menyimpan gambar QRIS yang diunggah admin.

drop policy if exists "Admins can manage settings" on public.app_settings;
revoke insert, update, delete on public.app_settings from anon, authenticated;

create or replace function public.admin_update_settings(p_settings jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  v jsonb;
  n numeric;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_typeof(p_settings) is distinct from 'object' then
    raise exception 'INVALID_SETTINGS';
  end if;

  for k, v in select key, value from jsonb_each(p_settings)
  loop
    if k = 'payment_gateway_enabled' then
      if jsonb_typeof(v) <> 'boolean' then
        raise exception 'INVALID_SETTINGS';
      end if;
    elsif k in (
      'payment_deadline_minutes', 'max_open_unpaid_orders',
      'max_qty_per_item', 'order_cooldown_threshold'
    ) then
      if jsonb_typeof(v) <> 'number' then
        raise exception 'INVALID_SETTINGS';
      end if;
      n := (v #>> '{}')::numeric;
      if n <> floor(n) then
        raise exception 'INVALID_SETTINGS';
      end if;
      if k = 'payment_deadline_minutes' and (n < 5 or n > 1440) then
        raise exception 'INVALID_SETTINGS';
      elsif k = 'max_open_unpaid_orders' and (n < 1 or n > 10) then
        raise exception 'INVALID_SETTINGS';
      elsif k = 'max_qty_per_item' and (n < 1 or n > 50) then
        raise exception 'INVALID_SETTINGS';
      elsif k = 'order_cooldown_threshold' and (n < 1 or n > 20) then
        raise exception 'INVALID_SETTINGS';
      end if;
    elsif k = 'qris_image_url' then
      if jsonb_typeof(v) <> 'string'
         or length(v #>> '{}') > 500
         or (v #>> '{}') !~ '^(/|https://)' then
        raise exception 'INVALID_SETTINGS';
      end if;
    else
      raise exception 'INVALID_SETTINGS';
    end if;

    insert into public.app_settings (key, value, updated_at, updated_by)
    values (k, v, now(), auth.uid())
    on conflict (key) do update
      set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  end loop;

  return (select jsonb_object_agg(key, value) from public.app_settings);
end;
$$;

revoke all on function public.admin_update_settings(jsonb) from public, anon;
grant execute on function public.admin_update_settings(jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-assets', 'payment-assets', true, 2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Payment assets are public" on storage.objects;
create policy "Payment assets are public"
  on storage.objects for select
  using (bucket_id = 'payment-assets');

drop policy if exists "Admins manage payment assets" on storage.objects;
create policy "Admins manage payment assets"
  on storage.objects for all
  using (bucket_id = 'payment-assets' and public.is_admin())
  with check (bucket_id = 'payment-assets' and public.is_admin());

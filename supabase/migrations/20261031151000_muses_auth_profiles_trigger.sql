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

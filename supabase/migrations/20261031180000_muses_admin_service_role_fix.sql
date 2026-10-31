-- Perbaikan bootstrap admin (2026-10-31):
-- Trigger prevent_role_self_promotion menolak SEMUA perubahan role saat
-- tidak ada admin yang login, karena public.is_admin() membaca auth.uid()
-- yang bernilai NULL untuk service_role key maupun koneksi SQL langsung.
-- Akibatnya akun admin pertama tidak bisa dipromosikan lewat API maupun
-- SQL Editor, sehingga aktivasi admin selalu gagal.
-- Perbaikan: perubahan role yang dilakukan dengan service_role key
-- (server-side saja, tidak pernah dipakai browser) diizinkan. User login
-- biasa yang bukan admin tetap ditolak, dan admin yang sudah login tetap
-- bisa mempromosikan lewat policy "Admins can manage profiles".
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

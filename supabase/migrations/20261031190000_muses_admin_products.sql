-- Admin store (2026-10-31): sebelumnya tabel products hanya punya policy
-- select publik, jadi tidak ada satu pun akun (termasuk admin) yang bisa
-- menambah, mengubah, atau menghapus produk lewat API. Tambahkan jalur
-- tulis untuk admin, mengikuti pola schedules di 20261031140200.
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

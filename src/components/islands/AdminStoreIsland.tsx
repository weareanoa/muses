import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { formatRupiah } from '../../lib/format';
import { fmt, getDict, translateServiceError, type Locale } from '../../i18n/dictionary';

// Admin Store, sepasang dengan AdminScheduleIsland.
// Gate-nya sama (sesi Supabase + profiles.role lewat
// getSupabaseAdminProfile); penegakan tulisnya ada di RLS — policy admin
// untuk products hidup di supabase/migrations/20261031190000.
// Sebelumnya products hanya punya policy select publik, jadi tanpa migrasi
// itu tidak ada akun yang bisa menyimpan produk lewat halaman ini.
//
// PERILAKU PENTING toko live (lihat productService.getCatalogItems):
// selama tabel products kosong, /store menampilkan katalog default dari
// kode (cheki, merchandise, videocall). Begitu ada 1 baris di database,
// /store HANYA menampilkan baris database. Karena itu halaman ini
// menampilkan peringatan tersebut di atas daftar, dan admin harus
// memasukkan semua produk yang mau dijual (termasuk cheki) sebelum
// menyimpan produk pertama.

type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  catalogType: string;
  subtitle: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  options: string[];
  isFeatured: boolean;
};

const CATEGORIES = [
  { value: 'CHEKI', label: 'Cheki' },
  { value: 'MERCHANDISE', label: 'Merchandise' },
  { value: 'VIDEOCALL', label: 'Videocall' },
] as const;

const DEFAULT_IMAGE = '/images/store/product-1.svg';

const EMPTY_FORM = {
  id: '',
  name: '',
  catalogType: 'MERCHANDISE' as string,
  subtitle: '',
  price: '',
  stock: '',
  image: '',
  description: '',
  optionsText: '',
  isFeatured: false,
};

type FormState = typeof EMPTY_FORM;

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'produk';
}

function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function mapRow(row: any): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category || '',
    catalogType: (row.catalog_type || row.category || 'MERCHANDISE').toUpperCase(),
    subtitle: row.subtitle || row.tagline || '',
    price: Number(row.price || 0),
    stock: Number(row.stock ?? 0),
    image: row.image || DEFAULT_IMAGE,
    description: row.description || '',
    options: Array.isArray(row.options)
      ? row.options
      : Array.isArray(row.sizes)
        ? row.sizes
        : [],
    isFeatured: Boolean(row.is_featured),
  };
}

export default function AdminStoreIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).admin;
  const [gate, setGate] = useState<GateState>('checking');
  const [adminEmail, setAdminEmail] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadProducts = async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    const { data, error: fetchError } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });
    if (fetchError) {
      setError(translateServiceError(locale, fetchError.message));
      return;
    }
    setProducts((data || []).map(mapRow));
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (alive) setGate('no-supabase');
        return;
      }
      const result = await authService.getSupabaseAdminProfile();
      if (!alive) return;
      if (!result.isLoggedIn) {
        setGate('login-required');
        return;
      }
      if (!result.isAdmin) {
        setAdminEmail(result.user?.email || '');
        setGate('forbidden');
        return;
      }
      setGate('ready');
      await loadProducts();
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !editingId && typeof value === 'string') {
        next.id = uniqueId(
          slugify(value),
          products.map((p) => p.id),
        );
      }
      return next;
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
  };

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      catalogType: product.catalogType,
      subtitle: product.subtitle,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image === DEFAULT_IMAGE ? '' : product.image,
      description: product.description,
      optionsText: product.options.join(', '),
      isFeatured: product.isFeatured,
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const name = form.name.trim();
    const id = form.id.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!name) {
      setError(d.errProdName);
      return;
    }
    if (!id) {
      setError(d.errProdId);
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError(d.errProdPrice);
      return;
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError(d.errProdStock);
      return;
    }
    const options = form.optionsText
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const payload: Record<string, unknown> = {
      name,
      category: form.catalogType,
      catalog_type: form.catalogType,
      subtitle: form.subtitle.trim(),
      tagline: form.subtitle.trim(),
      price,
      currency: 'IDR',
      image: form.image.trim() || DEFAULT_IMAGE,
      description: form.description.trim(),
      options,
      stock,
      is_featured: form.isFeatured,
      updated_at: new Date().toISOString(),
    };
    const sb = getSupabaseClient();
    if (!sb) {
      setError(d.errProdNoSupabase);
      return;
    }
    setBusy(true);
    if (editingId) {
      const { error: updateError } = await sb
        .from('products')
        .update(payload)
        .eq('id', editingId);
      if (updateError) {
        setError(translateServiceError(locale, updateError.message));
        setBusy(false);
        return;
      }
      setNotice(d.noticeProdUpdated);
    } else {
      const { error: insertError } = await sb.from('products').insert({
        ...payload,
        id,
      });
      if (insertError) {
        setError(translateServiceError(locale, insertError.message));
        setBusy(false);
        return;
      }
      setNotice(d.noticeProdAdded);
    }
    setBusy(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const sb = getSupabaseClient();
    if (!sb) return;
    setBusy(true);
    const { error: deleteError } = await sb.from('products').delete().eq('id', id);
    setBusy(false);
    if (deleteError) {
      setError(translateServiceError(locale, deleteError.message));
      return;
    }
    setConfirmDeleteId(null);
    setNotice(d.noticeProdDeleted);
    await loadProducts();
  };

  if (gate === 'checking') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center text-sm text-[#6E6453]">
        {d.checking}
      </div>
    );
  }

  if (gate === 'no-supabase') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.noSupabaseTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
          {d.storeNoSupabaseBody}
        </p>
      </div>
    );
  }

  if (gate === 'login-required') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.loginRequiredTitleStore}</h2>
        <p className="mt-2 text-sm text-[#6E6453]">
          {d.loginRequiredBody}
        </p>
        <a
          href={withBase('/admin/login')}
          className="mt-5 inline-block rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
        >
          {d.loginButton}
        </a>
      </div>
    );
  }

  if (gate === 'forbidden') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.forbiddenTitle}</h2>
        <p className="mt-2 text-sm text-[#6E6453]">
          {fmt(d.storeForbiddenBody, { account: adminEmail ? `Akun ${adminEmail}` : 'Akun ini' })}
        </p>
        <a
          href={withBase('/store')}
          className="mt-5 inline-block rounded-full border border-[#C9971C] px-6 py-2.5 text-sm font-bold text-[#8C6A1C]"
        >
          {d.backStore}
        </a>
      </div>
    );
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A1C]">{d.storeEyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1F1A12]">{d.storeHeading}</h1>
          <p className="mt-1 text-sm text-[#6E6453]">
            {fmt(d.count, { count: products.length })}
          </p>
        </div>
        <button
          onClick={startAdd}
          className="rounded-full bg-[#C9971C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
        >
          {d.addProductButton}
        </button>
      </div>

      <div className="rounded-2xl border border-[#E9D9AE] bg-[#FFF8E7] p-5">
        <p className="text-sm font-bold text-[#1F1A12]">{d.warningTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#6E6453]">
          {d.warningBody}
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#E9D9AE] bg-white p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-[#1F1A12]">
          {editingId ? d.formTitleEditProduct : d.formTitleNewProduct}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="store-name" className="text-sm font-medium text-[#1F1A12]">
              {d.prodName}
            </label>
            <input
              id="store-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={d.prodNamePh}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="store-id" className="text-sm font-medium text-[#1F1A12]">
              {d.prodId} {editingId ? d.idLocked : d.idAuto}
            </label>
            <input
              id="store-id"
              value={form.id}
              disabled={!!editingId}
              onChange={(e) => setField('id', e.target.value)}
              placeholder={d.prodIdPh}
              className={`${inputClass} disabled:opacity-60`}
            />
          </div>
          <div>
            <label htmlFor="store-category" className="text-sm font-medium text-[#1F1A12]">
              {d.prodCategory}
            </label>
            <select
              id="store-category"
              value={form.catalogType}
              onChange={(e) => setField('catalogType', e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="store-subtitle" className="text-sm font-medium text-[#1F1A12]">
              {d.prodSubtitle}
            </label>
            <input
              id="store-subtitle"
              value={form.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              placeholder={d.prodSubtitlePh}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="store-price" className="text-sm font-medium text-[#1F1A12]">
              {d.prodPrice}
            </label>
            <input
              id="store-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder={d.prodPricePh}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="store-stock" className="text-sm font-medium text-[#1F1A12]">
              {d.prodStock}
            </label>
            <input
              id="store-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setField('stock', e.target.value)}
              placeholder={d.prodStockPh}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="store-image" className="text-sm font-medium text-[#1F1A12]">
              {d.prodImage}
            </label>
            <input
              id="store-image"
              value={form.image}
              onChange={(e) => setField('image', e.target.value)}
              placeholder={d.prodImagePh}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="store-options" className="text-sm font-medium text-[#1F1A12]">
              {d.prodOptions}
            </label>
            <input
              id="store-options"
              value={form.optionsText}
              onChange={(e) => setField('optionsText', e.target.value)}
              placeholder={d.prodOptionsPh}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="store-description" className="text-sm font-medium text-[#1F1A12]">
              {d.prodDescription}
            </label>
            <textarea
              id="store-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#1F1A12]">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setField('isFeatured', e.target.checked)}
              className="h-4 w-4 accent-[#C9971C]"
            />
            {d.prodFeatured}
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418] disabled:opacity-60"
          >
            {busy ? d.saving : editingId ? d.saveEditProduct : d.saveNewProduct}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={startAdd}
              className="rounded-full border border-[#C9971C] px-6 py-2.5 text-sm font-bold text-[#8C6A1C]"
            >
              {d.cancelEdit}
            </button>
          )}
        </div>
      </form>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
          <p className="text-lg font-bold text-[#1F1A12]">{d.emptyProdTitle}</p>
          <p className="mt-2 text-sm text-[#6E6453]">
            {d.emptyProdBody}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E9D9AE] bg-white p-4"
            >
              <img
                src={withBase(product.image)}
                alt={product.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#1F1A12]">
                  {product.name}
                  {product.isFeatured && (
                    <span className="ml-2 rounded-full bg-[#F8E29E] px-2 py-0.5 text-[11px] font-bold text-[#5A3E00]">
                      {d.featuredBadge}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-[#6E6453]">
                  {product.catalogType} · {formatRupiah(product.price)} · {fmt(d.stockLabel, { stock: product.stock })}
                  {product.options.length > 0 ? ` · ${product.options.join(', ')}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(product)}
                  className="rounded-full border border-[#C9971C] px-4 py-1.5 text-xs font-bold text-[#8C6A1C]"
                >
                  {d.edit}
                </button>
                {confirmDeleteId === product.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={busy}
                      className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {d.confirmDelete}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-full border border-[#E9D9AE] px-4 py-1.5 text-xs font-bold text-[#6E6453]"
                    >
                      {d.cancel}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-bold text-red-700"
                  >
                    {d.delete}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

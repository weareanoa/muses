import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient } from '../../lib/supabase';
import { formatRupiah } from '../../lib/format';
import { fmt, getDict, translateServiceError, type Locale } from '../../i18n/dictionary';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  AdminField,
  AdminNotice,
  AdminSectionCard,
  AdminSelect,
  AdminToggle,
  ConfirmButton,
  EmptyState,
} from '../admin/ui';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { Plus, Package, Edit2, Trash2, X } from 'lucide-react';

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

let cachedProducts: AdminProduct[] | null = null;

export default function AdminStoreIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).admin;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [products, setProducts] = useState<AdminProduct[]>(() => cachedProducts || []);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(() => !cachedProducts);

  const loadProducts = async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    if (!cachedProducts) setLoading(true);
    const { data, error: fetchError } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });
    setLoading(false);
    if (fetchError) {
      if (!cachedProducts) setError(translateServiceError(locale, fetchError.message));
      return;
    }
    const mapped = (data || []).map(mapRow);
    cachedProducts = mapped;
    setProducts(mapped);
  };

  useEffect(() => {
    if (gate === 'ready') {
      loadProducts();
    }
  }, [gate]);

  if (gate !== 'ready') {
    return <AdminGateScreen gate={gate} adminEmail={adminEmail} locale={locale} onSignOut={signOut} />;
  }

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
    setIsFormOpen(true);
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
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
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
    closeForm();
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    setBusy(true);
    const { error: deleteError } = await sb.from('products').delete().eq('id', id);
    setBusy(false);
    if (deleteError) {
      setError(translateServiceError(locale, deleteError.message));
      return;
    }
    setNotice(d.noticeProdDeleted);
    await loadProducts();
  };

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => p.catalogType === selectedCategory);

  return (
    <AdminShell
      currentTab="store"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title={d.storeHeading}
      subtitle={d.storeIntro}
      actions={
        <Button size="sm" onClick={startAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>{d.addProductButton.replace('+ ', '')}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {notice && (
          <AdminNotice tone="success" role="status">
            {notice}
          </AdminNotice>
        )}
        {error && (
          <AdminNotice tone="error" role="alert">
            {error}
          </AdminNotice>
        )}

        {products.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
            <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">{d.warningTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">{d.warningBody}</p>
          </div>
        )}

        {/* Add/Edit Product Modal Form Card */}
        {isFormOpen && (
          <AdminSectionCard
            title={editingId ? d.formTitleEditProduct : d.formTitleNewProduct}
            description="Isi informasi produk untuk ditampilkan di etalase toko"
            actions={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            }
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={d.prodName} htmlFor="store-name" required>
                  <Input
                    id="store-name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder={d.prodNamePh}
                    required
                  />
                </AdminField>

                <AdminField
                  label={`${d.prodId} ${editingId ? d.idLocked : d.idAuto}`}
                  htmlFor="store-id"
                  required
                >
                  <Input
                    id="store-id"
                    value={form.id}
                    disabled={!!editingId}
                    onChange={(e) => setField('id', e.target.value)}
                    placeholder={d.prodIdPh}
                    required
                  />
                </AdminField>

                <AdminField label={d.prodCategory} htmlFor="store-category" required>
                  <AdminSelect
                    id="store-category"
                    value={form.catalogType}
                    onChange={(e) => setField('catalogType', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>

                <AdminField label={d.prodSubtitle} htmlFor="store-subtitle">
                  <Input
                    id="store-subtitle"
                    value={form.subtitle}
                    onChange={(e) => setField('subtitle', e.target.value)}
                    placeholder={d.prodSubtitlePh}
                  />
                </AdminField>

                <AdminField label={d.prodPrice} htmlFor="store-price" required>
                  <Input
                    id="store-price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                    placeholder={d.prodPricePh}
                    required
                  />
                </AdminField>

                <AdminField label={d.prodStock} htmlFor="store-stock" required>
                  <Input
                    id="store-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setField('stock', e.target.value)}
                    placeholder={d.prodStockPh}
                    required
                  />
                </AdminField>

                <div className="sm:col-span-2">
                  <AdminField label={d.prodImage} htmlFor="store-image">
                    <Input
                      id="store-image"
                      value={form.image}
                      onChange={(e) => setField('image', e.target.value)}
                      placeholder={d.prodImagePh}
                    />
                  </AdminField>
                </div>

                <div className="sm:col-span-2">
                  <AdminField label={d.prodOptions} htmlFor="store-options">
                    <Input
                      id="store-options"
                      value={form.optionsText}
                      onChange={(e) => setField('optionsText', e.target.value)}
                      placeholder={d.prodOptionsPh}
                    />
                  </AdminField>
                </div>

                <div className="sm:col-span-2">
                  <AdminField label={d.prodDescription} htmlFor="store-description">
                    <Textarea
                      id="store-description"
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      rows={3}
                    />
                  </AdminField>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <AdminToggle
                  checked={form.isFeatured}
                  onChange={(val) => setField('isFeatured', val)}
                  ariaLabel={d.prodFeatured}
                />
                <span className="text-xs font-medium text-zinc-700">{d.prodFeatured}</span>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button type="submit" loading={busy}>
                  {editingId ? d.saveEditProduct : d.saveNewProduct}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {d.cancel}
                </Button>
              </div>
            </form>
          </AdminSectionCard>
        )}

        {/* Product Catalog Card & Category Filter */}
        <AdminSectionCard
          title={fmt(d.prodListTitle, { count: filteredProducts.length })}
          description="Daftar produk aktif di etalase MUSES Store"
          actions={
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              {['ALL', 'CHEKI', 'MERCHANDISE', 'VIDEOCALL'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          }
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Memuat produk...</div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title={d.emptyProdTitle}
              description={d.emptyProdBody}
              action={
                <Button size="sm" onClick={startAdd}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>{d.addProductButton.replace('+ ', '')}</span>
                </Button>
              }
            />
          ) : (
            <div className="-mx-5 -my-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={withBase(product.image)}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover border border-zinc-200 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = withBase(DEFAULT_IMAGE);
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-zinc-900 truncate max-w-[200px]">
                                {product.name}
                              </p>
                              {product.isFeatured && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {d.featuredBadge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                              {product.subtitle || `#${product.id}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {product.catalogType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-900 whitespace-nowrap">
                        {formatRupiah(product.price)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-zinc-600">
                        <span className={product.stock <= 5 ? 'text-amber-600 font-semibold' : ''}>
                          {product.stock} pcs
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(product)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            <span>{d.edit}</span>
                          </Button>
                          <ConfirmButton
                            confirmLabel={d.confirmDelete}
                            onConfirm={() => handleDelete(product.id)}
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </ConfirmButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </AdminShell>
  );
}

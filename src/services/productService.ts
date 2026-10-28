import { getSupabaseClient } from '../lib/supabase';
import productsDataRaw from '../data/products.json';
import membersDataRaw from '../data/members.json';
import type { ProductDTO, CatalogItemDTO, ServiceResult } from '../types/database';

const fallbackProducts = productsDataRaw as ProductDTO[];

const CATALOG_MEMBER_ORDER = ['faril', 'mine', 'ndah', 'vira', 'vely', 'liz', 'lia'] as const;

const orderedMembers = [...membersDataRaw].sort(
  (a, b) => CATALOG_MEMBER_ORDER.indexOf(a.id as any) - CATALOG_MEMBER_ORDER.indexOf(b.id as any)
);

function formatTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => (word === 'of' ? 'of' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

const DEFAULT_CHEKI_ITEMS: CatalogItemDTO[] = orderedMembers.map((m) => ({
  id: `cheki-${m.id}`,
  name: m.stageName,
  category: 'CHEKI',
  subtitle: formatTitleCase(m.museCategory),
  color: m.themeColor,
  image: m.card,
  options: ['Two shot', 'Solo'],
  price: 40000,
  stock: 16,
}));

const DEFAULT_MERCHANDISE_ITEMS: CatalogItemDTO[] = [
  {
    id: 'official-light-stick',
    name: 'Light Stick',
    category: 'MERCHANDISE',
    subtitle: 'Rechargeable Concert Light Device',
    color: '#C9971C',
    image: '/images/store/product-1.svg',
    options: ['Box Set', 'Standard'],
    price: 880000,
    stock: 40,
  },
  {
    id: 'tour-hoodie',
    name: 'Tour Hoodie',
    category: 'MERCHANDISE',
    subtitle: 'Heavyweight Oversized Apparel',
    color: '#C9971C',
    image: '/images/store/product-2.svg',
    options: ['Size L', 'Size XL'],
    price: 1360000,
    stock: 25,
  },
  {
    id: 'limited-vinyl',
    name: 'Limited Vinyl',
    category: 'MERCHANDISE',
    subtitle: 'Chapter 02 Limited 180g LP',
    color: '#C9971C',
    image: '/images/store/product-3.svg',
    options: ['Gatefold', 'Standard'],
    price: 672000,
    stock: 15,
  },
  {
    id: 'slogan-towel',
    name: 'Slogan Towel',
    category: 'MERCHANDISE',
    subtitle: 'Official Microfiber Concert Towel',
    color: '#C9971C',
    image: '/images/store/product-1.svg',
    options: ['Gold Edition', 'Black Edition'],
    price: 448000,
    stock: 50,
  },
  {
    id: 'album-standard',
    name: 'Afterglow CD',
    category: 'MERCHANDISE',
    subtitle: 'Chapter 03 Photobook Edition',
    color: '#C9971C',
    image: '/images/store/product-2.svg',
    options: ['Version A', 'Version B'],
    price: 416000,
    stock: 30,
  },
  {
    id: 'knit-beanie',
    name: 'Knit Beanie',
    category: 'MERCHANDISE',
    subtitle: 'Embroidered Acrylic Knit',
    color: '#C9971C',
    image: '/images/store/product-3.svg',
    options: ['Ivory', 'Black'],
    price: 608000,
    stock: 20,
  },
];

const DEFAULT_VIDEOCALL_ITEMS: CatalogItemDTO[] = orderedMembers.map((m) => ({
  id: `videocall-${m.id}`,
  name: m.stageName,
  category: 'VIDEOCALL',
  subtitle: '1-on-1 Online Fansign',
  color: m.themeColor,
  image: m.card,
  options: ['60 Detik', '120 Detik'],
  price: 150000,
  stock: 8,
}));

const DEFAULT_CATALOG_ITEMS: CatalogItemDTO[] = [
  ...DEFAULT_CHEKI_ITEMS,
  ...DEFAULT_MERCHANDISE_ITEMS,
  ...DEFAULT_VIDEOCALL_ITEMS,
];

function mapDbProductToDto(row: any): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    price: Number(row.price || 0),
    currency: row.currency || 'USD',
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
    image: row.image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [row.image],
    description: row.description || '',
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
    stock: Number(row.stock ?? 0),
    sku: row.sku,
    releaseDate: row.release_date || row.releaseDate,
    manufacturer: row.manufacturer,
    origin: row.origin,
    colors: Array.isArray(row.colors) ? row.colors : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    details: Array.isArray(row.details) ? row.details : [],
    features: Array.isArray(row.features) ? row.features : [],
    packageContents: Array.isArray(row.package_contents)
      ? row.package_contents
      : Array.isArray(row.packageContents)
      ? row.packageContents
      : [],
    specifications: row.specifications || {},
  };
}

function mapDbCatalogItemToDto(row: any): CatalogItemDTO {
  return {
    id: row.id,
    name: row.name,
    category: (row.catalog_type || row.category || 'MERCHANDISE').toUpperCase() as CatalogItemDTO['category'],
    subtitle: row.subtitle || row.tagline || '',
    color: row.color || '#C9971C',
    image: row.image,
    options: Array.isArray(row.options)
      ? row.options
      : Array.isArray(row.sizes) && row.sizes.length > 0
      ? row.sizes
      : ['Standard'],
    price: Number(row.price || 0),
    stock: Number(row.stock ?? 0),
  };
}

export const productService = {
  getInitialProducts(): ProductDTO[] {
    return fallbackProducts;
  },

  getInitialCatalogItems(): CatalogItemDTO[] {
    return DEFAULT_CATALOG_ITEMS;
  },

  async getProducts(params?: {
    category?: string;
    isFeatured?: boolean;
    limit?: number;
  }): Promise<ServiceResult<ProductDTO[]>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        let query = sb.from('products').select('*');
        if (params?.category) {
          query = query.eq('category', params.category);
        }
        if (params?.isFeatured !== undefined) {
          query = query.eq('is_featured', params.isFeatured);
        }
        if (params?.limit) {
          query = query.limit(params.limit);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return { success: true, data: data.map(mapDbProductToDto) };
        }
      } catch (err) {
        console.error('Failed to fetch products from Supabase, using fallback:', err);
      }
    }

    let items = [...fallbackProducts];
    if (params?.category) {
      items = items.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.isFeatured !== undefined) {
      items = items.filter((p) => p.isFeatured === params.isFeatured);
    }
    if (params?.limit) {
      items = items.slice(0, params.limit);
    }
    return { success: true, data: items };
  },

  async getProductById(id: string): Promise<ServiceResult<ProductDTO>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('products').select('*').eq('id', id).single();
        if (!error && data) {
          return { success: true, data: mapDbProductToDto(data) };
        }
      } catch {}
    }

    const found = fallbackProducts.find((p) => p.id === id);
    if (!found) {
      return { success: false, error: 'Produk tidak ditemukan.' };
    }
    return { success: true, data: found };
  },

  async getCatalogItems(filter?: {
    category?: string;
    search?: string;
  }): Promise<ServiceResult<CatalogItemDTO[]>> {
    let items: CatalogItemDTO[] = [...DEFAULT_CATALOG_ITEMS];

    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          items = data.map(mapDbCatalogItemToDto);
        }
      } catch {}
    }

    if (filter?.category && filter.category !== 'Semua') {
      items = items.filter((i) => i.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.trim().toLowerCase();
      if (q) {
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.subtitle.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        );
      }
    }

    return { success: true, data: items };
  },

  async updateStock(productId: string, quantityDelta: number): Promise<ServiceResult<{ stock: number }>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data: current } = await sb
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        if (current) {
          const nextStock = Math.max(0, Number(current.stock) + quantityDelta);
          const { error } = await sb
            .from('products')
            .update({ stock: nextStock, updated_at: new Date().toISOString() })
            .eq('id', productId);
          if (!error) {
            return { success: true, data: { stock: nextStock } };
          }
        }
      } catch {}
    }
    return { success: true, data: { stock: 0 } };
  },

  async upsertProduct(product: ProductDTO): Promise<ServiceResult<ProductDTO>> {
    const sb = getSupabaseClient();
    if (!sb) {
      return { success: true, data: product };
    }

    const { data, error } = await sb
      .from('products')
      .upsert({
        id: product.id,
        name: product.name,
        tagline: product.tagline,
        category: product.category,
        price: product.price,
        currency: product.currency,
        rating: product.rating,
        review_count: product.reviewCount,
        image: product.image,
        gallery: product.gallery || [product.image],
        description: product.description,
        is_featured: product.isFeatured,
        stock: product.stock,
        sku: product.sku,
        release_date: product.releaseDate,
        manufacturer: product.manufacturer,
        origin: product.origin,
        colors: product.colors || [],
        sizes: product.sizes || [],
        details: product.details || [],
        features: product.features || [],
        package_contents: product.packageContents || [],
        specifications: product.specifications || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Gagal menyimpan produk.' };
    }
    return { success: true, data: mapDbProductToDto(data) };
  },

  async deleteProduct(id: string): Promise<ServiceResult<boolean>> {
    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true, data: true };
  },
};


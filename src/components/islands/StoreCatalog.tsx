import React, { useState } from 'react';
import { withBase } from '../../lib/paths';
import { addToCart } from '../../stores/cartStore';
import { formatRupiah } from '../../lib/format';

export interface CatalogItem {
  id: string;
  name: string;
  category: 'CHEKI' | 'MERCHANDISE' | 'VIDEOCALL';
  subtitle: string;
  color?: string;
  image: string;
  options: string[];
  price: number;
  stock: number;
}

const MEMBERS = [
  {
    id: 'faril',
    name: 'Faril',
    muse: 'Muse of Melpomene',
    color: '#8E24AA',
    image: '/images/members/faril.webp',
  },
  {
    id: 'mine',
    name: 'Mine',
    muse: 'Muse of Clio',
    color: '#FBC02D',
    image: '/images/members/mine.webp',
  },
  {
    id: 'ndah',
    name: 'Ndah',
    muse: 'Muse of Polyhymnia',
    color: '#43A047',
    image: '/images/members/ndah.webp',
  },
  {
    id: 'vira',
    name: 'Vira',
    muse: 'Muse of Erato',
    color: '#FFA7D6',
    image: '/images/members/vira.webp',
  },
  {
    id: 'vely',
    name: 'Vely',
    muse: 'Muse of Terpsichore',
    color: '#1E88E5',
    image: '/images/members/vely.webp',
  },
  {
    id: 'liz',
    name: 'Liz',
    muse: 'Muse of Calliope',
    color: '#E53935',
    image: '/images/members/liz.webp',
  },
  {
    id: 'lia',
    name: 'Lia',
    muse: 'Muse of Erato',
    color: '#523C05',
    image: '/images/members/lia.webp',
  },
];

const CHEKI_ITEMS: CatalogItem[] = MEMBERS.map((m) => ({
  id: `cheki-${m.id}`,
  name: m.name,
  category: 'CHEKI',
  subtitle: m.muse,
  color: m.color,
  image: m.image,
  options: ['Two shot', 'Solo'],
  price: 40000,
  stock: 16,
}));

const MERCHANDISE_ITEMS: CatalogItem[] = [
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

const VIDEOCALL_ITEMS: CatalogItem[] = MEMBERS.map((m) => ({
  id: `videocall-${m.id}`,
  name: m.name,
  category: 'VIDEOCALL',
  subtitle: '1-on-1 Online Fansign',
  color: m.color,
  image: m.image,
  options: ['60 Detik', '120 Detik'],
  price: 150000,
  stock: 8,
}));

const ALL_CATALOG_ITEMS: CatalogItem[] = [
  ...CHEKI_ITEMS,
  ...MERCHANDISE_ITEMS,
  ...VIDEOCALL_ITEMS,
];

function StoreCard({
  item,
  onAddToCart,
  isAdded,
}: {
  item: CatalogItem;
  onAddToCart: (item: CatalogItem, variant: string) => void;
  isAdded: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState(item.options[0] || 'Standard');

  return (
    <div className="group bg-white border border-[#EADBBD] rounded-[26px] sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-[0_14px_30px_rgba(201,151,28,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col font-['Poppins',sans-serif]">
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-[#FAF3E2]/50">
        <img
          src={withBase(item.image)}
          alt={item.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
        <div>
          <span className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
            {item.category}
          </span>
          <h3 className="font-balbes text-3xl sm:text-4xl text-[#1F1A12] leading-tight tracking-tight mt-0.5">
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color || '#C9971C' }}
            />
            <span className="text-xs text-[#5A4E38] font-medium truncate">
              {item.subtitle}
            </span>
          </div>
        </div>

        {item.options && item.options.length > 0 && (
          <div className="bg-[#F8E29E]/60 p-1 rounded-full flex items-center justify-between gap-1">
            {item.options.map((opt) => {
              const active = selectedVariant === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedVariant(opt)}
                  className={`flex-1 py-1 px-3 text-center rounded-full text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-white font-bold text-[#1F1A12] shadow-xs'
                      : 'text-[#1F1A12] font-medium hover:text-black'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <span className="text-base sm:text-lg font-bold text-[#1F1A12]">
              {formatRupiah(item.price)}
            </span>
            <span className="text-xs text-[#8C7A58]">
              Sisa {item.stock}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(item, selectedVariant)}
            className="w-full py-2.5 sm:py-3 rounded-full text-center text-xs sm:text-sm font-bold text-[#1F1A12] shadow-xs hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 50%, #A37418 100%)',
            }}
          >
            {isAdded ? '✓ Ditambahkan' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoreCatalog() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = ['Semua', 'Cheki', 'Merchandise', 'Videocall'];

  const filteredItems = ALL_CATALOG_ITEMS.filter((item) => {
    const matchesCategory =
      activeCategory === 'Semua' ||
      item.category.toLowerCase() === activeCategory.toLowerCase();

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (item: CatalogItem, variant: string) => {
    addToCart({
      id: item.id,
      name: `${item.category === 'CHEKI' ? 'Cheki' : item.category === 'VIDEOCALL' ? 'Videocall' : ''} ${item.name}`.trim(),
      price: item.price,
      currency: 'IDR',
      image: item.image,
      size: variant,
      quantity: 1,
    });

    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="w-full font-['Poppins',sans-serif]">
      <div className="mb-6 sm:mb-8 pl-1">
        <h1 className="font-balbes text-6xl sm:text-7xl md:text-8xl text-[#1F1A12] leading-none tracking-normal select-none">
          Store
        </h1>
      </div>

      <div
        className="relative w-full rounded-3xl sm:rounded-[32px] overflow-hidden shadow-xs mb-8 sm:mb-10 flex flex-col md:flex-row items-center justify-between pl-6 sm:pl-10 lg:pl-14 py-6 sm:py-7 md:py-8 pr-0 gap-6"
        style={{
          background: 'linear-gradient(90deg, #B8860B 0%, #F6DD8A 54%, #D4A017 83%, #523C05 100%)',
        }}
      >
        <div className="max-w-xl lg:max-w-2xl z-10 text-left py-1 pr-4 sm:pr-6 md:pr-8">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white text-[#9E7B26] font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-3 shadow-2xs">
            PRE-ORDER
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight text-[#FFF8E7] leading-tight">
            Pilih member <span className="text-[#3D2800]">favoritmu!</span>
          </h2>
          <p className="text-xs sm:text-[13px] text-[#FFF4D4]/90 leading-relaxed mt-2.5 font-normal max-w-lg lg:max-w-xl">
            From MUSES apparel to collectible photopacks, bring your favorite moments closer. A little piece of MUSES, made just for you
          </p>
        </div>

        <div className="w-full md:w-auto flex justify-end items-center self-center shrink-0 z-10 -mr-2 sm:-mr-3 md:-mr-4">
          <img
            src={withBase('/images/banner/shop-banner.svg')}
            alt="MUSES Members"
            className="h-36 sm:h-42 md:h-48 lg:h-52 w-auto object-contain object-right select-none pointer-events-none drop-shadow-md"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-7 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-[#2A1D0B] shadow-xs'
                    : 'border border-[#C9971C]/50 bg-white hover:bg-[#FAF3E2] text-[#1F1A12] font-semibold'
                }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 60%, #8A6A1C 100%)' }
                    : undefined
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 lg:w-72">
          <input
            type="text"
            placeholder="Cari Member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-2.5 rounded-full border border-[#C9971C]/50 bg-white text-xs sm:text-sm text-[#1F1A12] placeholder-[#8C7A58] focus:outline-none focus:border-[#C9971C] transition-all"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#FAF3E2] rounded-3xl border border-[#EADBBD]">
          <p className="text-sm font-medium text-[#5A4E38]">
            Tidak ada produk yang cocok dengan pencarian "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => (
            <StoreCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              isAdded={!!addedIds[item.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

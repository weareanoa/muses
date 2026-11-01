import { useState } from 'react';
import { StoreCard } from './StoreCatalog';
import { addToCart } from '../../stores/cartStore';
import type { CatalogItemDTO } from '../../types/database';
import type { Locale } from '../../i18n/dictionary';

export default function ChekiPreview({ items, locale = 'id' }: { items: CatalogItemDTO[]; locale?: Locale }) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (item: CatalogItemDTO, variant: string) => {
    addToCart({
      id: item.id,
      name: `Cheki ${item.name}`,
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
    <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 px-1 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:px-0">
      {items.map((item) => (
        <div key={item.id} className="shrink-0 w-[240px] min-[380px]:w-[260px] snap-center md:w-auto">
          <StoreCard
            item={item}
            onAddToCart={handleAddToCart}
            locale={locale}
            isAdded={!!addedIds[item.id]}
          />
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { StoreCard } from './StoreCatalog';
import { addToCart } from '../../stores/cartStore';
import type { CatalogItemDTO } from '../../types/database';
import type { Locale } from '../../i18n/dictionary';

// Home Store preview: the exact same card as the /store catalog, so the
// two places can never drift apart again. Items come from Astro (cheki
// catalog items, price already in IDR); the toggle and Tambah behaviour
// below mirrors StoreCatalog.handleAddToCart exactly.
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
      {items.map((item) => (
        <StoreCard
          key={item.id}
          item={item}
          onAddToCart={handleAddToCart}
          locale={locale}
          isAdded={!!addedIds[item.id]}
        />
      ))}
    </div>
  );
}

import { atom, computed } from 'nanostores';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

const loadInitialCart = (): CartItem[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('muse_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }
  return [];
};

export const cartItems = atom<CartItem[]>(loadInitialCart());
export const isCartOpen = atom<boolean>(false);

if (typeof window !== 'undefined') {
  cartItems.subscribe((items) => {
    try {
      localStorage.setItem('muse_cart', JSON.stringify(items));
    } catch (e) {
    }
  });
}

export function openCart() {
  isCartOpen.set(true);
}

export function closeCart() {
  isCartOpen.set(false);
}

export function toggleCart() {
  isCartOpen.set(!isCartOpen.get());
}

export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  const current = cartItems.get();
  const qtyToAdd = item.quantity || 1;
  const existingIndex = current.findIndex(
    (i) => i.id === item.id && i.size === item.size && i.color === item.color
  );

  if (existingIndex > -1) {
    const updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + qtyToAdd,
    };
    cartItems.set(updated);
  } else {
    cartItems.set([...current, { ...item, quantity: qtyToAdd }]);
  }
  isCartOpen.set(true);
}

export function removeFromCart(id: string, size?: string, color?: string) {
  const current = cartItems.get();
  cartItems.set(
    current.filter(
      (item) => !(item.id === id && item.size === size && item.color === color)
    )
  );
}

export function updateQuantity(id: string, quantity: number, size?: string, color?: string) {
  if (quantity <= 0) {
    removeFromCart(id, size, color);
    return;
  }
  const current = cartItems.get();
  cartItems.set(
    current.map((item) => {
      if (item.id === id && item.size === size && item.color === color) {
        return { ...item, quantity };
      }
      return item;
    })
  );
}

export function clearCart() {
  cartItems.set([]);
}

export const totalCartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartSubtotal = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);
